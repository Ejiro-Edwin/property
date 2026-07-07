import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreatePaymentScheduleDto,
  InitiatePaymentDto,
  VerifyPaymentDto,
} from '../../common/tenantsea-dtos';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Roles('LANDLORD', 'ADMIN')
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('schedules')
  createPaymentSchedule(@Body() dto: CreatePaymentScheduleDto) {
    return this.paymentsService.createPaymentSchedule(dto);
  }

  @Get('schedules')
  getPaymentSchedules(@Query('tenantId') tenantId: string, @Query('tenancyId') tenancyId?: string) {
    return this.paymentsService.getPaymentSchedules(tenantId, tenancyId);
  }

  @Roles('LANDLORD', 'ADMIN')
  @Post('reconcile')
  reconcileSchedules(@Query('tenantId') tenantId: string) {
    return this.paymentsService.reconcileSchedules(tenantId);
  }

  @Get('history')
  getPaymentHistory(@Query('tenantId') tenantId: string, @Query('tenancyId') tenancyId?: string, @Query() pagination?: any) {
    return this.paymentsService.getPaymentHistory(tenantId, tenancyId, pagination);
  }
}
