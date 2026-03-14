import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Request, Query, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
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

  // Get local upload URL for video upload (replaces S3 presigned URL)
  @Get('upload-url')
  @ApiQuery({ name: 'fileName', required: true })
  getUploadUrl(@Request() req, @Query('fileName') fileName: string) {
    return this.avatarsService.getUploadUrl(req.user.workspaceId, fileName);
  }

  // Accept the actual video file upload and save it locally
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req: any, _file, cb) => {
          // The target filename was generated and returned by getUploadUrl
          const target = req.query?.fileName || `${Date.now()}-upload`;
          cb(null, target);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    const apiUrl = (process.env.BACKEND_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    const origin = apiUrl.replace(/\/api$/, '');
    return { fileUrl: `${origin}/uploads/${file.filename}` };
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
