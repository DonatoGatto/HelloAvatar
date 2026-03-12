import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get('current')
  getCurrent(@Request() req) {
    return this.workspacesService.findById(req.user.workspaceId);
  }

  @Get('current/usage')
  getUsage(@Request() req) {
    return this.workspacesService.getUsage(req.user.workspaceId);
  }

  @Get('current/members')
  getMembers(@Request() req) {
    return this.workspacesService.getMembers(req.user.workspaceId);
  }

  @Patch('current')
  update(@Request() req, @Body() dto: UpdateWorkspaceDto) {
    return this.workspacesService.update(req.user.workspaceId, dto);
  }

  @Delete('current/members/:userId')
  removeMember(@Request() req, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(req.user.workspaceId, userId, req.user.userId);
  }
}
