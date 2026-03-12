import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: { workspaceId },
      select: { id: true, name: true, key: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(workspaceId: string, name: string) {
    const key = 'ha_' + randomBytes(32).toString('hex');
    return this.prisma.apiKey.create({
      data: { workspaceId, name, key },
    });
  }

  async revoke(workspaceId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id, workspaceId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async delete(workspaceId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id, workspaceId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.delete({ where: { id } });
  }

  async validateKey(key: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: { workspace: true },
    });
    if (!apiKey || !apiKey.isActive) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey;
  }
}
