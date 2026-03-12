import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeygenService } from '../heygen/heygen.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { GenerateVideoDto } from './dto/video.dto';

const CREDITS_PER_MINUTE = 1;
const POLLING_INTERVAL_MS = 3000;

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private heygen: HeygenService,
    private workspacesService: WorkspacesService,
  ) {}

  async generate(workspaceId: string, dto: GenerateVideoDto) {
    // Verify credits (estimate: 1 credit for now, deduct on completion)
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!dto.test && workspace.credits < 1) throw new ForbiddenException('Insufficient credits');

    // Get avatar
    const avatar = await this.prisma.avatar.findFirst({ where: { id: dto.avatarId, workspaceId } });
    if (!avatar) throw new NotFoundException('Avatar not found');

    // Create video record
    const video = await this.prisma.video.create({
      data: {
        workspaceId,
        avatarId: dto.avatarId,
        title: dto.title,
        script: dto.script,
        voiceId: dto.voiceId,
        status: 'PENDING',
      },
    });

    // Kick off HeyGen video generation
    setImmediate(async () => {
      try {
        const result = await this.heygen.generateVideo({
          avatarId: avatar.heygenAvatarId,
          script: dto.script,
          voiceId: dto.voiceId,
          background: dto.background,
          test: dto.test,
        });

        await this.prisma.video.update({
          where: { id: video.id },
          data: { heygenVideoId: result.video_id, status: 'PROCESSING' },
        });

        // Poll for completion
        this.pollVideoStatus(video.id, result.video_id, workspaceId, dto.test);
      } catch (err) {
        this.logger.error(`Video generation failed: ${err.message}`);
        await this.prisma.video.update({
          where: { id: video.id },
          data: { status: 'FAILED' },
        });
      }
    });

    return video;
  }

  private async pollVideoStatus(videoId: string, heygenVideoId: string, workspaceId: string, isTest: boolean) {
    const maxAttempts = 60; // 3 min max polling
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const data = await this.heygen.getVideoStatus(heygenVideoId);

        if (data.status === 'completed') {
          const durationSecs = data.duration ? Math.ceil(data.duration) : 60;
          const creditsCost = isTest ? 0 : Math.ceil(durationSecs / 60) * CREDITS_PER_MINUTE;

          await this.prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'COMPLETED',
              url: data.video_url,
              thumbnailUrl: data.thumbnail_url,
              durationSecs,
              creditsCost,
            },
          });

          if (!isTest && creditsCost > 0) {
            await this.workspacesService.deductCredits(workspaceId, creditsCost, 'video_generation', videoId);
          }
          return;
        }

        if (data.status === 'failed') {
          await this.prisma.video.update({ where: { id: videoId }, data: { status: 'FAILED' } });
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, POLLING_INTERVAL_MS);
        } else {
          await this.prisma.video.update({ where: { id: videoId }, data: { status: 'FAILED' } });
        }
      } catch (err) {
        this.logger.error(`Polling error for ${videoId}: ${err.message}`);
        if (attempts < maxAttempts) setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    setTimeout(poll, POLLING_INTERVAL_MS);
  }

  async findAll(workspaceId: string) {
    return this.prisma.video.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { avatar: { select: { id: true, name: true, thumbnailUrl: true } } },
    });
  }

  async findOne(workspaceId: string, videoId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, workspaceId },
      include: { avatar: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async getStatus(workspaceId: string, videoId: string) {
    const video = await this.findOne(workspaceId, videoId);
    if (video.heygenVideoId && video.status === 'PROCESSING') {
      const heygenData = await this.heygen.getVideoStatus(video.heygenVideoId);
      return { ...video, heygenStatus: heygenData };
    }
    return video;
  }

  async getByShareToken(shareToken: string) {
    const video = await this.prisma.video.findUnique({
      where: { shareToken },
      select: { id: true, title: true, url: true, thumbnailUrl: true, durationSecs: true, status: true },
    });
    if (!video || video.status !== 'COMPLETED') throw new NotFoundException('Video not found');
    return video;
  }

  async delete(workspaceId: string, videoId: string) {
    const video = await this.findOne(workspaceId, videoId);
    if (video.heygenVideoId) {
      try { await this.heygen.deleteVideo(video.heygenVideoId); } catch (e) {
        this.logger.warn(`Failed to delete HeyGen video ${video.heygenVideoId}: ${e.message}`);
      }
    }
    return this.prisma.video.delete({ where: { id: videoId } });
  }
}
