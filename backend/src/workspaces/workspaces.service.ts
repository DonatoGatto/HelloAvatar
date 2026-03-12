import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceDto } from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        users: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } } } },
        _count: { select: { avatars: true, videos: true, streamingSessions: true } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async getUsage(workspaceId: string) {
    const [videos, sessions, credits] = await Promise.all([
      this.prisma.video.count({ where: { workspaceId } }),
      this.prisma.streamingSession.count({ where: { workspaceId } }),
      this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { credits: true, plan: true } }),
    ]);

    const recentVideos = await this.prisma.video.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { avatar: { select: { name: true, thumbnailUrl: true } } },
    });

    const activeSessions = await this.prisma.streamingSession.count({
      where: { workspaceId, status: 'ACTIVE' },
    });

    return {
      totalVideos: videos,
      totalSessions: sessions,
      activeSessions,
      credits: credits?.credits,
      plan: credits?.plan,
      recentVideos,
    };
  }

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceUser.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async removeMember(workspaceId: string, userId: string, requesterId: string) {
    const requester = await this.prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId: requesterId, workspaceId } },
    });
    if (!requester || requester.role === 'MEMBER') throw new ForbiddenException('Insufficient permissions');

    const target = await this.prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new ForbiddenException('Cannot remove workspace owner');

    return this.prisma.workspaceUser.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  }

  async deductCredits(workspaceId: string, amount: number, reason: string, referenceId?: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.credits < amount) throw new ForbiddenException('Insufficient credits');

    await this.prisma.$transaction([
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { credits: { decrement: amount } },
      }),
      this.prisma.creditTransaction.create({
        data: { workspaceId, amount: -amount, reason, referenceId },
      }),
    ]);
  }

  async addCredits(workspaceId: string, amount: number, reason: string) {
    await this.prisma.$transaction([
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { credits: { increment: amount } },
      }),
      this.prisma.creditTransaction.create({
        data: { workspaceId, amount, reason },
      }),
    ]);
  }
}
