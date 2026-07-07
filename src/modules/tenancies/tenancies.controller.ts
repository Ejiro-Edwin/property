import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTenancyDto } from '../../common/tenantsea-dtos';
import { TenanciesService } from './tenancies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PaginationDto } from '../../common/pagination.dto';

@ApiTags('Tenancies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenancies')
export class TenanciesController {
  constructor(private readonly tenanciesService: TenanciesService) {}

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post()
  createTenancy(@Body() dto: CreateTenancyDto) {
    return this.tenanciesService.createTenancy(dto);
  }

  @Get()
  listTenancies(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.tenanciesService.listTenancies(tenantId, pagination);
  }
}
