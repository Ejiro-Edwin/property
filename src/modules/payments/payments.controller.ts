import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
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
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiatePayment(@Body() dto: InitiatePaymentDto, @Request() req: any) {
    return this.paymentsService.initiatePayment(dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Roles('LANDLORD', 'ADMIN')
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post('schedules')
  createPaymentSchedule(@Body() dto: CreatePaymentScheduleDto) {
    return this.paymentsService.createPaymentSchedule(dto);
  }

  @Get('schedules')
  getPaymentSchedules(
    @Query('tenantId') tenantId: string,
    @Query('tenancyId') tenancyId: string | undefined,
    @Request() req: any,
  ) {
    return this.paymentsService.getPaymentSchedules(tenantId, tenancyId, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Roles('LANDLORD', 'ADMIN')
  @Post('reconcile')
  reconcileSchedules(@Query('tenantId') tenantId: string) {
    return this.paymentsService.reconcileSchedules(tenantId);
  }

  @Get('history')
  getPaymentHistory(
    @Query('tenantId') tenantId: string,
    @Query('tenancyId') tenancyId: string | undefined,
    @Query() pagination: any,
    @Request() req: any,
  ) {
    return this.paymentsService.getPaymentHistory(tenantId, tenancyId, pagination, {
      id: req.user.id,
      role: req.user.role,
    });
  }
}
