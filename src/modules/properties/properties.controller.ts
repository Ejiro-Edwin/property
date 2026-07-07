import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreatePropertyDto } from '../../common/tenantsea-dtos';
import { PropertiesService } from './properties.service';
import { PaginationDto } from '../../common/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Properties')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post()
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.createProperty(dto);
  }

  @Get()
  listProperties(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.propertiesService.listProperties(tenantId, pagination);
  }
}
