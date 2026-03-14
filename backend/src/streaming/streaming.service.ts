import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { HeygenService } from '../heygen/heygen.service';
import Groq from 'groq-sdk';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

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
    if (process.env.SIMLI_API_KEY) {
      try {
        // Priority: avatar's own simliEaceId → env SIMLI_FACE_ID → derive from thumbnail
        const avatarFaceId = (avatar as any)?.simliEaceId;
        const envFaceId = process.env.SIMLI_FACE_ID;
        if (avatarFaceId) {
          simliSessionToken = await this.simliGetSession(avatarFaceId);
        } else if (envFaceId) {
          simliSessionToken = await this.simliGetSession(envFaceId);
        } else if (thumbnailUrl) {
          simliSessionToken = await this.simliGetSessionFromImage(thumbnailUrl);
        } else {
          simliSessionToken = await this.simliGetSession('tmp9i8bbq7');
        }
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
    };
  }

  // Main chat endpoint: user message → Groq AI → Edge TTS audio
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

    // ── 2. Convert text to speech using Microsoft Edge TTS (free) ───────────
    let audioBase64 = '';
    try {
      const tts = new MsEdgeTTS();
      // Priority: widget config ttsVoice → avatar ttsVoice → env EDGE_TTS_VOICE → default
      const voice = (session.widgetConfig as any)?.ttsVoice || (session.avatar as any)?.ttsVoice || process.env.EDGE_TTS_VOICE || 'en-US-JennyNeural';
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const readable = tts.toStream(aiText);

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        readable.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        readable.on('end', resolve);
        readable.on('error', reject);
      });
      audioBase64 = Buffer.concat(chunks).toString('base64');
    } catch (err) {
      this.logger.error('Edge TTS error', err?.message);
      // Return text without audio — frontend will use Web Speech API as fallback
    }

    return { text: aiText, audioBase64, audioMime: 'audio/mpeg' };
  }

  // ─── SIMLI.AI PROXY ─────────────────────────────────────────────────────────

  async simliGetSession(faceId: string): Promise<string> {
    const resp = await axios.post(
      'https://api.simli.ai/startAudioToVideoSession',
      { apiKey: process.env.SIMLI_API_KEY, faceId, handleSilence: true },
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
    return this.prisma.widgetConfig.create({ data: { ...data, workspaceId } });
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
