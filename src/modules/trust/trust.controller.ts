import { Controller, ForbiddenException, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Trust')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Roles('LANDLORD', 'ADMIN', 'LETTING_AGENT')
  @Get('dashboard')
  getLandlordDashboard(@Query('tenantId') tenantId: string) {
    return this.trustService.getLandlordDashboard(tenantId);
  }

  @Get(':tenantUserId')
  getTrustProfile(
    @Param('tenantUserId') tenantUserId: string,
    @Query('tenantId') tenantId: string,
    @Request() req: any,
  ) {
    const isPrivileged = ['LANDLORD', 'ADMIN', 'LETTING_AGENT'].includes(req?.user?.role);
    const isSelf = req?.user?.id === tenantUserId;
    if (!isPrivileged && !isSelf) {
      throw new ForbiddenException('Insufficient permissions to view this trust profile');
    }
    return this.trustService.getTrustProfile(tenantId, tenantUserId);
  }
}
