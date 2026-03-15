import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Streaming')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('streaming')
export class StreamingController {
  constructor(private streamingService: StreamingService) {}

  // Widget configurations
  @Get('widgets')
  getWidgets(@Request() req) {
    return this.streamingService.getWidgetConfigs(req.user.workspaceId);
  }

  @Post('widgets')
  createWidget(@Request() req, @Body() dto: any) {
    return this.streamingService.createWidgetConfig(req.user.workspaceId, dto);
  }

  @Patch('widgets/:id')
  updateWidget(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.streamingService.updateWidgetConfig(req.user.workspaceId, id, dto);
  }

  @Delete('widgets/:id')
  deleteWidget(@Request() req, @Param('id') id: string) {
    return this.streamingService.deleteWidgetConfig(req.user.workspaceId, id);
  }

  // Session history
  @Get('sessions')
  getSessions(@Request() req) {
    return this.streamingService.getSessionHistory(req.user.workspaceId);
  }

  // Admin: end a session manually
  @Post('sessions/:id/end')
  endSession(@Param('id') id: string) {
    return this.streamingService.endSession(id);
  }
}

// ─── Public API consumed by the embedded widget ───────────────────────────────
import { Controller as Ctrl2, Post as Post2, Body as Body2, Param as Param2 } from '@nestjs/common';

@ApiTags('Widget Public API')
@Ctrl2('public/streaming')
export class StreamingPublicController {
  constructor(private streamingService: StreamingService) {}

  /** Start a new chat session → returns sessionId + idle video URL */
  @Post2('start')
  startSession(@Body2() body: { widgetConfigId: string; visitorId: string }) {
    return this.streamingService.startSession(body.widgetConfigId, body.visitorId);
  }

  /**
   * Main chat turn:
   * user message → Groq Llama3 (free) → Edge TTS (free)
   * Returns { text, audioBase64, audioMime }
   */
  @Post2(':sessionId/chat')
  chat(
    @Param2('sessionId') sessionId: string,
    @Body2() body: { message: string },
  ) {
    return this.streamingService.chat(sessionId, body.message);
  }

  /** TTS-only: speak text via Edge TTS, return audio for avatar lip-sync */
  @Post2(':sessionId/speak')
  speak(
    @Param2('sessionId') sessionId: string,
    @Body2() body: { text: string },
  ) {
    return this.streamingService.speak(sessionId, body.text);
  }

  /** End session and deduct credits */
  @Post2(':sessionId/end')
  endSession(@Param2('sessionId') id: string) {
    return this.streamingService.endSession(id);
  }

  // ── HeyGen Streaming proxy endpoints (hide API key from browser) ──────────

  @Post2('heygen/token')
  heygenToken() {
    return this.streamingService.heygenGetToken();
  }

  @Post2('heygen/new')
  heygenNew(@Body2() body: { avatarId: string; quality?: string }) {
    return this.streamingService.heygenNew(body.avatarId, body.quality);
  }

  @Post2('heygen/start')
  heygenStart(@Body2() body: { heygenSessionId: string; sdpAnswer: string }) {
    return this.streamingService.heygenStart(body.heygenSessionId, body.sdpAnswer);
  }

  @Post2('heygen/talk')
  heygenTalk(@Body2() body: { heygenSessionId: string; text: string }) {
    return this.streamingService.heygenTalk(body.heygenSessionId, body.text);
  }

  @Post2('heygen/stop')
  heygenStop(@Body2() body: { heygenSessionId: string }) {
    return this.streamingService.heygenStop(body.heygenSessionId);
  }

  @Post2('heygen/interrupt')
  heygenInterrupt(@Body2() body: { heygenSessionId: string }) {
    return this.streamingService.heygenInterrupt(body.heygenSessionId);
  }

  // ── Simli.ai session proxy ────────────────────────────────────────────────

  @Post2('simli/session')
  simliSession(@Body2() body: { faceId?: string; imageUrl?: string }) {
    if (body.imageUrl) return this.streamingService.simliGetSessionFromImage(body.imageUrl).then(t => ({ session_token: t }));
    return this.streamingService.simliGetSession(body.faceId || 'tmp9i8bbq7').then(t => ({ session_token: t }));
  }
}
