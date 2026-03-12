import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { GenerateVideoDto } from './dto/video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post('generate')
  generate(@Request() req, @Body() dto: GenerateVideoDto) {
    return this.videosService.generate(req.user.workspaceId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.videosService.findAll(req.user.workspaceId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.videosService.findOne(req.user.workspaceId, id);
  }

  @Get(':id/status')
  getStatus(@Request() req, @Param('id') id: string) {
    return this.videosService.getStatus(req.user.workspaceId, id);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.videosService.delete(req.user.workspaceId, id);
  }
}

// Public share endpoint (no auth)
import { Controller as Ctrl2, Get as Get2, Param as Param2 } from '@nestjs/common';

@ApiTags('Public')
@Ctrl2('public/videos')
export class VideoShareController {
  constructor(private videosService: VideosService) {}

  @Get2(':shareToken')
  getShared(@Param2('shareToken') shareToken: string) {
    return this.videosService.getByShareToken(shareToken);
  }
}
