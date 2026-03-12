import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  findAll(@Request() req) {
    return this.apiKeysService.findAll(req.user.workspaceId);
  }

  @Post()
  create(@Request() req, @Body() body: { name: string }) {
    return this.apiKeysService.create(req.user.workspaceId, body.name);
  }

  @Patch(':id/revoke')
  revoke(@Request() req, @Param('id') id: string) {
    return this.apiKeysService.revoke(req.user.workspaceId, id);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.apiKeysService.delete(req.user.workspaceId, id);
  }
}
