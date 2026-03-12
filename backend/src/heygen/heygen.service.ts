import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class HeygenService {
  private readonly logger = new Logger(HeygenService.name);
  private readonly client: AxiosInstance;
  private readonly baseURL = 'https://api.heygen.com';

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('HEYGEN_API_KEY');
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        this.logger.error(`HeyGen API error: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
        throw new HttpException(
          err.response?.data?.message || 'HeyGen API error',
          err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    );
  }

  // ─── AVATARS ──────────────────────────────────────────────────────────────

  async listAvatars(): Promise<HeygenAvatar[]> {
    const res = await this.client.get('/v2/avatars');
    return res.data.data?.avatars || [];
  }

  async getAvatar(avatarId: string) {
    const res = await this.client.get(`/v2/avatars/${avatarId}`);
    return res.data.data;
  }

  // ─── INSTANT AVATAR (CUSTOM) ──────────────────────────────────────────────

  async createInstantAvatar(videoUrl: string, name: string) {
    const res = await this.client.post('/v2/avatars/instant', {
      video_url: videoUrl,
      name,
    });
    return res.data.data; // { avatar_id, status }
  }

  async getInstantAvatarStatus(avatarId: string) {
    const res = await this.client.get(`/v2/avatars/${avatarId}`);
    return res.data.data;
  }

  // ─── VOICES ───────────────────────────────────────────────────────────────

  async listVoices() {
    const res = await this.client.get('/v2/voices');
    return res.data.data?.voices || [];
  }

  // ─── VIDEO GENERATION ─────────────────────────────────────────────────────

  async generateVideo(payload: GenerateVideoPayload) {
    const res = await this.client.post('/v2/video/generate', {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: payload.avatarId,
            avatar_style: payload.avatarStyle || 'normal',
          },
          voice: payload.voiceId
            ? { type: 'text', input_text: payload.script, voice_id: payload.voiceId }
            : { type: 'text', input_text: payload.script },
          background: payload.background || { type: 'color', value: '#FAFAFA' },
        },
      ],
      dimension: payload.dimension || { width: 1280, height: 720 },
      test: payload.test || false,
    });
    return res.data.data; // { video_id }
  }

  async getVideoStatus(videoId: string) {
    const res = await this.client.get(`/v1/video_status.get?video_id=${videoId}`);
    return res.data.data; // { status, video_url, thumbnail_url, duration }
  }

  async deleteVideo(videoId: string) {
    const res = await this.client.delete(`/v1/video.delete`, { data: { video_id: videoId } });
    return res.data;
  }

  // ─── STREAMING AVATAR ─────────────────────────────────────────────────────

  async createStreamingSession(avatarId: string, quality: string = 'low') {
    const res = await this.client.post('/v1/streaming.new', {
      avatar_name: avatarId,
      quality,
    });
    return res.data.data; // { session_id, sdp, ice_servers }
  }

  async startStreamingSession(sessionId: string, sdpAnswer: string) {
    const res = await this.client.post('/v1/streaming.start', {
      session_id: sessionId,
      sdp: { type: 'answer', sdp: sdpAnswer },
    });
    return res.data.data;
  }

  async sendStreamingText(sessionId: string, text: string) {
    const res = await this.client.post('/v1/streaming.task', {
      session_id: sessionId,
      text,
      task_type: 'talk',
    });
    return res.data.data;
  }

  async stopStreamingSession(sessionId: string) {
    const res = await this.client.post('/v1/streaming.stop', { session_id: sessionId });
    return res.data.data;
  }

  async getStreamingToken() {
    const res = await this.client.post('/v1/streaming.create_token');
    return res.data.data; // { token }
  }

  async listStreamingSessions() {
    const res = await this.client.get('/v1/streaming.list');
    return res.data.data;
  }

  async interruptStreaming(sessionId: string) {
    const res = await this.client.post('/v1/streaming.interrupt', { session_id: sessionId });
    return res.data.data;
  }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface HeygenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
}

export interface GenerateVideoPayload {
  avatarId: string;
  script: string;
  voiceId?: string;
  avatarStyle?: string;
  background?: any;
  dimension?: { width: number; height: number };
  test?: boolean;
}
