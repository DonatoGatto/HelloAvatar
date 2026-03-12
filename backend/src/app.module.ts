import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HeygenModule } from './heygen/heygen.module';
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AvatarsModule } from './avatars/avatars.module';
import { VideosModule } from './videos/videos.module';
import { StreamingModule } from './streaming/streaming.module';
import { BillingModule } from './billing/billing.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    HeygenModule,
    ElevenLabsModule,
    S3Module,
    AuthModule,
    WorkspacesModule,
    AvatarsModule,
    VideosModule,
    StreamingModule,
    BillingModule,
    ApiKeysModule,
    WidgetModule,
  ],
})
export class AppModule {}
