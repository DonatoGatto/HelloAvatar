import { Module } from '@nestjs/common';
import { VideosController, VideoShareController } from './videos.controller';
import { VideosService } from './videos.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [VideosController, VideoShareController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
