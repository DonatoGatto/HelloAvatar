import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('ELEVENLABS_API_KEY');
    this.client = axios.create({
      baseURL: 'https://api.elevenlabs.io/v1',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  async listVoices() {
    const res = await this.client.get('/voices');
    return res.data.voices || [];
  }

  async getVoice(voiceId: string) {
    const res = await this.client.get(`/voices/${voiceId}`);
    return res.data;
  }

  async textToSpeech(voiceId: string, text: string, modelId: string = 'eleven_multilingual_v2') {
    const res = await this.client.post(
      `/text-to-speech/${voiceId}`,
      { text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
      { responseType: 'arraybuffer' },
    );
    return Buffer.from(res.data);
  }
}
