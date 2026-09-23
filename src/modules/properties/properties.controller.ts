import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreatePropertyAmenityDto, CreatePropertyDto, CreatePropertyRuleDto, UpdatePropertyDto } from '../../common/tenantsea-dtos';
import { PropertiesService } from './properties.service';
import { PaginationDto } from '../../common/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Properties')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post()
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.createProperty(dto);
  }

  @Get()
  listProperties(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto, @Request() req: any) {
    return this.propertiesService.listProperties(tenantId, pagination, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Get(':id')
  getProperty(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) {
    return this.propertiesService.getProperty(tenantId, id, { id: req.user.id, role: req.user.role });
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Patch(':id')
  updateProperty(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.updateProperty(id, dto);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post(':id/amenities')
  addAmenity(@Param('id') id: string, @Body() dto: CreatePropertyAmenityDto) {
    return this.propertiesService.addAmenity(id, dto);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete(':id/amenities/:amenityId')
  removeAmenity(@Param('id') id: string, @Param('amenityId') amenityId: string, @Query('tenantId') tenantId: string) {
    return this.propertiesService.removeAmenity(id, amenityId, tenantId);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post(':id/rules')
  addRule(@Param('id') id: string, @Body() dto: CreatePropertyRuleDto) {
    return this.propertiesService.addRule(id, dto);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete(':id/rules/:ruleId')
  removeRule(@Param('id') id: string, @Param('ruleId') ruleId: string, @Query('tenantId') tenantId: string) {
    return this.propertiesService.removeRule(id, ruleId, tenantId);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete(':id')
  deleteProperty(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.propertiesService.deleteProperty(tenantId, id);
  }
}
