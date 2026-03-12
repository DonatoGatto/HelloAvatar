import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const slug = dto.workspaceName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        workspaces: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: dto.workspaceName,
                slug,
                plan: 'FREE',
                credits: 20, // free starter credits
              },
            },
          },
        },
      },
      include: {
        workspaces: { include: { workspace: true } },
      },
    });

    const workspace = user.workspaces[0].workspace;
    const token = this.generateToken(user.id, workspace.id);
    return { token, user: this.sanitizeUser(user), workspace };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { workspaces: { include: { workspace: true } } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const workspace = user.workspaces[0]?.workspace;
    const token = this.generateToken(user.id, workspace?.id);
    return { token, user: this.sanitizeUser(user), workspace };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaces: {
          include: { workspace: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    return this.sanitizeUser(user);
  }

  private generateToken(userId: string, workspaceId: string) {
    return this.jwtService.sign({ sub: userId, workspaceId });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
