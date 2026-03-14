import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeygenService } from '../heygen/heygen.service';
import { CreateCustomAvatarDto, UpdateAvatarDto, AddStockAvatarDto } from './dto/avatars.dto';

@Injectable()
export class AvatarsService {
  private readonly logger = new Logger(AvatarsService.name);

  constructor(
    private prisma: PrismaService,
    private heygen: HeygenService,
  ) {}

  // ─── STOCK AVATARS ────────────────────────────────────────────────────────

  async getStockAvatars() {
    return this.heygen.listAvatars();
  }

  async addStockAvatar(workspaceId: string, dto: AddStockAvatarDto) {
    return this.prisma.avatar.create({
      data: {
        workspaceId,
        heygenAvatarId: dto.heygenAvatarId,
        name: dto.name,
        thumbnailUrl: dto.thumbnailUrl,
        previewVideoUrl: dto.previewVideoUrl,
        simliEaceId: dto.simliEaceId,
        ttsVoice: dto.ttsVoice,
        type: 'STOCK',
        status: 'READY',
      },
    });
  }

  // ─── WORKSPACE AVATARS ─────────────────────────────────────────────────────

  async findAll(workspaceId: string) {
    return this.prisma.avatar.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, avatarId: string) {
    const avatar = await this.prisma.avatar.findFirst({
      where: { id: avatarId, workspaceId },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
    return avatar;
  }

  // ─── CUSTOM AVATAR ────────────────────────────────────────────────────────

  async getUploadUrl(_workspaceId: string, fileName: string) {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${Date.now()}-${safe}`;
    // BACKEND_URL may be e.g. "http://localhost:4000/api" or "http://localhost:4000"
    const apiUrl = (process.env.BACKEND_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    // Strip trailing /api to get the base origin for static files
    const origin = apiUrl.replace(/\/api$/, '');
    const uploadUrl = `${apiUrl}/avatars/upload?fileName=${encodeURIComponent(storedName)}`;
    const fileUrl = `${origin}/uploads/${storedName}`;
    return { uploadUrl, fileUrl };
  }

  async createCustomAvatar(workspaceId: string, dto: CreateCustomAvatarDto) {
    // Create pending avatar record
    const avatar = await this.prisma.avatar.create({
      data: {
        workspaceId,
        name: dto.name,
        type: 'CUSTOM',
        status: 'PENDING',
        sourceVideoUrl: dto.sourceVideoUrl,
      },
    });

    // Kick off HeyGen instant avatar creation job
    try {
      const result = await this.heygen.createInstantAvatar(dto.sourceVideoUrl, dto.name);
      await this.prisma.avatar.update({
        where: { id: avatar.id },
        data: {
          heygenAvatarId: result.avatar_id,
          heygenJobId: result.job_id,
          status: 'PROCESSING',
          simliEaceId: dto.simliEaceId,
          ttsVoice: dto.ttsVoice,
        },
      });
    } catch (err) {
      this.logger.error(`HeyGen instant avatar creation failed: ${err.message}`);
      await this.prisma.avatar.update({
        where: { id: avatar.id },
        data: { status: 'FAILED' },
      });
    }

    return this.prisma.avatar.findUnique({ where: { id: avatar.id } });
  }

  async checkCustomAvatarStatus(workspaceId: string, avatarId: string) {
    const avatar = await this.findOne(workspaceId, avatarId);
    if (!avatar.heygenAvatarId) return avatar;

    const heygenData = await this.heygen.getInstantAvatarStatus(avatar.heygenAvatarId);

    if (heygenData.status === 'completed' && avatar.status !== 'READY') {
      return this.prisma.avatar.update({
        where: { id: avatarId },
        data: {
          status: 'READY',
          thumbnailUrl: heygenData.preview_image_url,
          previewVideoUrl: heygenData.preview_video_url,
        },
      });
    }

    if (heygenData.status === 'failed') {
      return this.prisma.avatar.update({
        where: { id: avatarId },
        data: { status: 'FAILED' },
      });
    }

    return avatar;
  }

  async update(workspaceId: string, avatarId: string, dto: UpdateAvatarDto) {
    await this.findOne(workspaceId, avatarId);
    return this.prisma.avatar.update({
      where: { id: avatarId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.simliEaceId !== undefined && { simliEaceId: dto.simliEaceId }),
        ...(dto.ttsVoice !== undefined && { ttsVoice: dto.ttsVoice }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
      },
    });
  }

  async delete(workspaceId: string, avatarId: string) {
    await this.findOne(workspaceId, avatarId);
    return this.prisma.avatar.delete({ where: { id: avatarId } });
  }

  async getVoices() {
    return this.heygen.listVoices();
  }
}
