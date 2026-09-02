import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentMethodsService } from './payment-methods.service';

class CreatePaymentMethodDto { @IsString() tenantId: string; @IsString() type: string; @IsString() label: string; @IsOptional() @IsString() @Length(4, 4) last4?: string; @IsOptional() @IsString() provider?: string; @IsOptional() @IsString() providerRef?: string; @IsOptional() @IsBoolean() isDefault?: boolean; }
class UpdatePaymentMethodDto { @IsString() tenantId: string; @IsOptional() @IsString() label?: string; @IsOptional() @IsBoolean() isDefault?: boolean; }

@ApiTags('Payment methods')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}
  @Get() list(@Query('tenantId') tenantId: string, @Request() req: any) { return this.service.list(tenantId, req.user.id); }
  @Post() create(@Body() dto: CreatePaymentMethodDto, @Request() req: any) { return this.service.create(dto, req.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto, @Request() req: any) { return this.service.update(dto.tenantId, id, req.user.id, dto); }
  @Delete(':id') remove(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) { return this.service.remove(tenantId, id, req.user.id); }
}
