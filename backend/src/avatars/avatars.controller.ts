import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvatarsService } from './avatars.service';
import { CreateCustomAvatarDto, UpdateAvatarDto, AddStockAvatarDto } from './dto/avatars.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avatars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('avatars')
export class AvatarsController {
  constructor(private avatarsService: AvatarsService) {}

  // Stock library from HeyGen
  @Get('stock')
  getStock() {
    return this.avatarsService.getStockAvatars();
  }

  @Post('stock')
  addStock(@Request() req, @Body() dto: AddStockAvatarDto) {
    return this.avatarsService.addStockAvatar(req.user.workspaceId, dto);
  }

  // Voices
  @Get('voices')
  getVoices() {
    return this.avatarsService.getVoices();
  }

  // Get presigned S3 URL for video upload
  @Get('upload-url')
  @ApiQuery({ name: 'fileName', required: true })
  getUploadUrl(@Request() req, @Query('fileName') fileName: string) {
    return this.avatarsService.getUploadUrl(req.user.workspaceId, fileName);
  }

  // Workspace avatars
  @Get()
  findAll(@Request() req) {
    return this.avatarsService.findAll(req.user.workspaceId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.avatarsService.findOne(req.user.workspaceId, id);
  }

  @Post('custom')
  createCustom(@Request() req, @Body() dto: CreateCustomAvatarDto) {
    return this.avatarsService.createCustomAvatar(req.user.workspaceId, dto);
  }

  @Get(':id/status')
  checkStatus(@Request() req, @Param('id') id: string) {
    return this.avatarsService.checkCustomAvatarStatus(req.user.workspaceId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAvatarDto) {
    return this.avatarsService.update(req.user.workspaceId, id, dto);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.avatarsService.delete(req.user.workspaceId, id);
  }
}
