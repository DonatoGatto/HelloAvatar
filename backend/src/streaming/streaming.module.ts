import { Module } from '@nestjs/common';
import { StreamingController, StreamingPublicController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [StreamingController, StreamingPublicController],
  providers: [StreamingService],
  exports: [StreamingService],
})
export class StreamingModule {}
