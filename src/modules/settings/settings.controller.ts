import { Body, Controller, Get, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettingsService } from './settings.service';

class UpdateSettingsDto {
  @IsString() tenantId: string;
  @IsOptional() @IsObject() leasePreferences?: Record<string, unknown>;
  @IsOptional() @IsObject() paymentPreferences?: Record<string, unknown>;
  @IsOptional() @IsObject() notificationPreferences?: Record<string, unknown>;
  @IsOptional() @IsObject() privacyPreferences?: Record<string, unknown>;
}

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  @Get() get(@Query('tenantId') tenantId: string, @Request() req: any) { return this.service.get(tenantId, req.user.id); }
  @Patch() update(@Body() dto: UpdateSettingsDto, @Request() req: any) { return this.service.update(dto.tenantId, req.user.id, dto); }
}
