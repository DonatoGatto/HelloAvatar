import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { HeygenService } from '../heygen/heygen.service';
import Groq from 'groq-sdk';
import axios from 'axios';
import { spawn } from 'child_process';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MsEdgeTTS } = require('msedge-tts');

/** Convert any audio buffer to raw PCM s16le 16kHz mono using ffmpeg */
function toPcm16k(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegInstaller.path, [
      '-i', 'pipe:0',
      '-f', 's16le',
      '-ar', '16000',
      '-ac', '1',
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    const chunks: Buffer[] = [];
    ff.stdout.on('data', (c: Buffer) => chunks.push(c));
    ff.stdout.on('end', () => resolve(Buffer.concat(chunks)));
    ff.stderr.on('data', () => {}); // suppress ffmpeg logs
    ff.on('error', reject);
    ff.stdin.write(inputBuffer);
    ff.stdin.end();
  });
}

/**
 * Microsoft Edge TTS (via msedge-tts v2) — free, no API key, high-quality neural voices.
 * Uses lt-LT-OnaNeural by default = female Lithuanian voice.
 * Returns MP3, then we convert to raw PCM 16kHz 16-bit mono for Simli.
 */
async function edgeTTS(text: string, voice = 'lt-LT-OnaNeural'): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, 'audio-24khz-48kbitrate-mono-mp3', {});
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', resolve);
    audioStream.on('close', resolve);
    audioStream.on('error', reject);
  });
  tts.close();
  if (chunks.length === 0) throw new Error('Edge TTS returned no audio');
  const mp3 = Buffer.concat(chunks);
  // Convert MP3 → raw PCM 16kHz so Simli can process it
  return toPcm16k(mp3);
}

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private groq: Groq;

  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    private heygen: HeygenService,
  ) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }

  // Called by the widget to start a session
  async startSession(widgetConfigId: string, visitorId: string) {
    const widgetConfig = await this.prisma.widgetConfig.findUnique({
      where: { id: widgetConfigId },
      include: { avatar: true, workspace: true },
    });
    if (!widgetConfig || !widgetConfig.isActive) throw new NotFoundException('Widget config not found or inactive');

    const workspace = widgetConfig.workspace;
    if (workspace.credits < 1) throw new ForbiddenException('Workspace has insufficient credits');

    const session = await this.prisma.streamingSession.create({
      data: {
        workspaceId: widgetConfig.workspaceId,
        avatarId: widgetConfig.avatarId,
        widgetConfigId,
        status: 'ACTIVE',
        visitorId,
        metadata: {},
      },
    });

    const avatar = widgetConfig.avatar as any;
    const thumbnailUrl = avatar?.thumbnailUrl || null;
    const heygenAvatarId = avatar?.heygenAvatarId || null;

    // Try to get Simli session token if API key is configured
    let simliSessionToken: string | null = null;
    let simliE2E = false; // always use compose (audio-to-video) mode — E2E uses different WS URL
    if (process.env.SIMLI_API_KEY) {
      try {
        const widgetFaceId = (widgetConfig as any)?.simliFaceId;
        const avatarFaceId = avatar?.simliEaceId;
        const envFaceId = process.env.SIMLI_FACE_ID;
        const faceId = widgetFaceId || avatarFaceId || envFaceId || 'tmp9i8bbq7';
        // Always use compose/token — widget WS connects to /compose/webrtc/p2p
        simliSessionToken = await this.simliGetSession(faceId);
      } catch (e) {
        this.logger.warn('Simli session creation failed, continuing without: ' + e.message);
      }
    }

    return {
      sessionId: session.id,
      greeting: widgetConfig.greeting,
      aiPersona: widgetConfig.aiPersona,
      idleVideoUrl: avatar?.idleVideoUrl || thumbnailUrl || null,
      primaryColor: (widgetConfig as any).primaryColor || '#6366f1',
      title: widgetConfig.name,
      heygenAvatarId,
      thumbnailUrl,
      simliSessionToken,
      simliE2E,
      simliApiKey: simliSessionToken ? (process.env.SIMLI_API_KEY || null) : null,
    };
  }

  // Main chat endpoint: user message → Groq AI → Google TTS audio
  async chat(sessionId: string, userMessage: string): Promise<{ text: string; audioBase64: string; audioMime: string }> {
    const session = await this.prisma.streamingSession.findUnique({
      where: { id: sessionId },
      include: { widgetConfig: true, avatar: true },
    });
    if (!session || session.status !== 'ACTIVE') throw new NotFoundException('Session not found or ended');

    const systemPrompt = (session.widgetConfig as any)?.aiPersona ||
      'You are a helpful AI assistant. Be concise and friendly. Keep answers under 3 sentences.';

    // ── 1. Get AI response from Groq (Llama 3.1 – free & fast) ─────────────
    let aiText = '';
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.7,
      });
      aiText = completion.choices[0]?.message?.content?.trim() || 'I could not process that request.';
    } catch (err) {
      this.logger.error('Groq API error', err?.message);
      aiText = 'I am having trouble responding right now. Please try again.';
    }

    // ── 2. TTS via Edge TTS (Microsoft) → raw PCM 16kHz (Simli format) ──────────
    let audioBase64 = '';
    try {
      const ttsVoice = (session.widgetConfig as any)?.ttsVoice || 'lt-LT-OnaNeural';
      const pcm = await edgeTTS(aiText, ttsVoice);
      audioBase64 = pcm.toString('base64');
    } catch (err) {
      this.logger.error('TTS error: ' + (err?.message || String(err)));
      // Return text without audio — frontend will use Web Speech API as fallback
    }

    return { text: aiText, audioBase64, audioMime: 'audio/pcm' };
  }

  // ─── TTS-only speak (for greeting / avatar intro) ──────────────────────────
  async speak(sessionId: string, text: string): Promise<{ audioBase64: string; audioMime: string }> {
    const session = await this.prisma.streamingSession.findUnique({
      where: { id: sessionId },
      include: { widgetConfig: true, avatar: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    const ttsVoice = (session.widgetConfig as any)?.ttsVoice || 'lt-LT-OnaNeural';
    let audioBase64 = '';
    try {
      const pcm = await edgeTTS(text, ttsVoice);
      audioBase64 = pcm.toString('base64');
    } catch (err) {
      this.logger.error('TTS speak error: ' + (err?.message || String(err)));
    }
    return { audioBase64, audioMime: 'audio/pcm' };
  }

  // ─── SIMLI.AI PROXY ─────────────────────────────────────────────────────────

  async simliGetSession(faceId: string): Promise<string> {
    // Use the new /compose/token endpoint (matches the simli-client SDK)
    const resp = await axios.post(
      'https://api.simli.ai/compose/token',
      { faceId, handleSilence: true, maxSessionLength: 300, maxIdleTime: 60 },
      { headers: { 'Content-Type': 'application/json', 'x-simli-api-key': process.env.SIMLI_API_KEY }, timeout: 10000 },
    );
    return resp.data.session_token;
  }

  async simliGetE2ESession(faceId: string): Promise<string> {
    const voiceId = process.env.SIMLI_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
    const resp = await axios.post(
      'https://api.simli.ai/startE2ESession',
      { apiKey: process.env.SIMLI_API_KEY, faceId, voiceId, handleSilence: true },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    return resp.data.session_token;
  }

  async simliGetSessionFromImage(imageUrl: string): Promise<string> {
    // Create a face from image URL, then start session
    let faceId: string;
    try {
      const faceResp = await axios.post(
        'https://api.simli.ai/UploadFaceToSimli',
        { url: imageUrl },
        { headers: { 'Content-Type': 'application/json', 'x-simli-api-key': process.env.SIMLI_API_KEY }, timeout: 15000 },
      );
      faceId = faceResp.data.faceId || faceResp.data.face_id;
    } catch {
      faceId = 'tmp9i8bbq7'; // fallback to demo face
    }
    return this.simliGetSession(faceId);
  }

  // ─── HEYGEN STREAMING PROXY ───────────────────────────────────────────────

  async heygenGetToken() {
    return this.heygen.getStreamingToken();
  }

  async heygenNew(avatarId: string, quality = 'low') {
    return this.heygen.createStreamingSession(avatarId, quality);
  }

  async heygenStart(heygenSessionId: string, sdpAnswer: string) {
    return this.heygen.startStreamingSession(heygenSessionId, sdpAnswer);
  }

  async heygenTalk(heygenSessionId: string, text: string) {
    return this.heygen.sendStreamingText(heygenSessionId, text);
  }

  async heygenStop(heygenSessionId: string) {
    return this.heygen.stopStreamingSession(heygenSessionId);
  }

  async heygenInterrupt(heygenSessionId: string) {
    return this.heygen.interruptStreaming(heygenSessionId);
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.streamingSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const endedAt = new Date();
    const durationSecs = Math.ceil((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    const creditsCost = Math.max(1, Math.ceil(durationSecs / 60));

    const updated = await this.prisma.streamingSession.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt, durationSecs, creditsCost },
    });

    await this.workspacesService.deductCredits(
      session.workspaceId,
      creditsCost,
      'streaming_session',
      sessionId,
    );

    return updated;
  }

  // ─── WIDGET CONFIG ─────────────────────────────────────────────────────────

  async getWidgetConfigs(workspaceId: string) {
    return this.prisma.widgetConfig.findMany({
      where: { workspaceId },
      include: { avatar: { select: { id: true, name: true, thumbnailUrl: true } } },
    });
  }

  async createWidgetConfig(workspaceId: string, data: any) {
    const { avatarId, ...rest } = data;
    return this.prisma.widgetConfig.create({
      data: {
        ...rest,
        workspaceId,
        ...(avatarId ? { avatarId } : {}),
      },
    });
  }

  async updateWidgetConfig(workspaceId: string, id: string, data: any) {
    const config = await this.prisma.widgetConfig.findFirst({ where: { id, workspaceId } });
    if (!config) throw new NotFoundException('Widget config not found');
    return this.prisma.widgetConfig.update({ where: { id }, data });
  }

  async deleteWidgetConfig(workspaceId: string, id: string) {
    const config = await this.prisma.widgetConfig.findFirst({ where: { id, workspaceId } });
    if (!config) throw new NotFoundException('Widget config not found');
    return this.prisma.widgetConfig.delete({ where: { id } });
  }

  async getSessionHistory(workspaceId: string) {
    return this.prisma.streamingSession.findMany({
      where: { workspaceId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { avatar: { select: { name: true } }, widgetConfig: { select: { name: true } } },
    });
  }
}
