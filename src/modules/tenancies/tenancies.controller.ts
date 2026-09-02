import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTenancyDto, UpdateTenancyDto } from '../../common/tenantsea-dtos';
import { TenanciesService } from './tenancies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination.dto';

@ApiTags('Tenancies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('tenancies')
export class TenanciesController {
  constructor(private readonly tenanciesService: TenanciesService) {}

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post()
  createTenancy(@Body() dto: CreateTenancyDto) {
    return this.tenanciesService.createTenancy(dto);
  }

  @Get()
  listTenancies(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto, @Request() req: any) {
    return this.tenanciesService.listTenancies(tenantId, pagination, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Get(':id')
  getTenancy(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) {
    return this.tenanciesService.getTenancy(tenantId, id, { id: req.user.id, role: req.user.role });
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Patch(':id')
  updateTenancy(@Param('id') id: string, @Body() dto: UpdateTenancyDto) {
    return this.tenanciesService.updateTenancy(id, dto);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Delete(':id')
  deleteTenancy(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.tenanciesService.deleteTenancy(tenantId, id);
  }
}
