import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyFeaturesService } from './property-features.service';

class FeatureDto { @IsString() tenantId: string; @IsString() name: string; @IsOptional() @IsString() details?: string; }
@ApiTags('Property features')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('properties/:propertyId')
export class PropertyFeaturesController {
  constructor(private readonly service: PropertyFeaturesService) {}
  @Get('amenities') listAmenities(@Param('propertyId') propertyId: string, @Query('tenantId') tenantId: string) { return this.service.listAmenities(tenantId, propertyId); }
  @Get('rules') listRules(@Param('propertyId') propertyId: string, @Query('tenantId') tenantId: string) { return this.service.listRules(tenantId, propertyId); }
  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post('amenities') addAmenity(@Param('propertyId') propertyId: string, @Body() dto: FeatureDto) { return this.service.addAmenity(dto.tenantId, propertyId, dto.name); }
  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post('rules') addRule(@Param('propertyId') propertyId: string, @Body() dto: FeatureDto) { return this.service.addRule(dto.tenantId, propertyId, dto.name, dto.details); }
  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete('amenities/:id') removeAmenity(@Param('id') id: string, @Query('tenantId') tenantId: string) { return this.service.removeAmenity(tenantId, id); }
  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete('rules/:id') removeRule(@Param('id') id: string, @Query('tenantId') tenantId: string) { return this.service.removeRule(tenantId, id); }
}
