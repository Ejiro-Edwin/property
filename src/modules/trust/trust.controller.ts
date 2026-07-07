import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Trust')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('dashboard')
  getLandlordDashboard(@Query('tenantId') tenantId: string) {
    return this.trustService.getLandlordDashboard(tenantId);
  }

  @Get(':tenantUserId')
  getTrustProfile(@Param('tenantUserId') tenantUserId: string, @Query('tenantId') tenantId: string) {
    return this.trustService.getTrustProfile(tenantId, tenantUserId);
  }
}
