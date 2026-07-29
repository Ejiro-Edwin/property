import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcceptInviteDto, CreateInviteDto } from '../../common/tenantsea-dtos';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  // --- Public endpoints (used by the accept-invite page) ---

  @Get('preview')
  preview(@Query('token') token: string) {
    return this.invitesService.previewInvite(token);
  }

  @Post('accept')
  accept(@Body() dto: AcceptInviteDto) {
    return this.invitesService.acceptInvite(dto);
  }

  // --- Workspace management endpoints ---

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN', 'LETTING_AGENT')
  @Post()
  create(@Body() dto: CreateInviteDto, @Request() req: any) {
    return this.invitesService.createInvite(dto, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN', 'LETTING_AGENT')
  @Get()
  list(@Query('tenantId') tenantId: string) {
    return this.invitesService.listInvites(tenantId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  @Post(':id/revoke')
  revoke(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.invitesService.revokeInvite(body.tenantId, id);
  }
}
