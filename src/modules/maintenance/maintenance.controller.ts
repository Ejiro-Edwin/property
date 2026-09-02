import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MaintenanceService } from './maintenance.service';

class CreateMaintenanceDto {
  @IsString() tenantId: string;
  @IsString() @MinLength(2) title: string;
  @IsString() @MinLength(2) description: string;
  @IsOptional() @IsString() propertyId?: string;
  @IsOptional() @IsString() tenancyId?: string;
  @IsOptional() @IsIn(['low', 'normal', 'high', 'urgent']) priority?: string;
}
class UpdateMaintenanceDto {
  @IsString() tenantId: string;
  @IsOptional() @IsIn(['open', 'in_progress', 'resolved', 'closed']) status?: string;
  @IsOptional() @IsIn(['low', 'normal', 'high', 'urgent']) priority?: string;
  @IsOptional() @IsString() assigneeId?: string | null;
}

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}
  @Get() list(@Query('tenantId') tenantId: string, @Query('status') status: string | undefined, @Request() req: any) { return this.service.list(tenantId, req.user, status); }
  @Get(':id') get(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) { return this.service.get(tenantId, id, req.user); }
  @Post() create(@Body() dto: CreateMaintenanceDto, @Request() req: any) { return this.service.create(dto, req.user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto, @Request() req: any) { return this.service.update(dto.tenantId, id, dto, req.user); }
}
