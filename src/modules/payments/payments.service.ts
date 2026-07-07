import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client';
import {
  CreatePaymentScheduleDto,
  InitiatePaymentDto,
  PaymentStatus,
  VerifyPaymentDto,
} from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

  async initiatePayment(dto: InitiatePaymentDto): Promise<any> {
    const tenancy = await this.prisma.tenancy.findFirst({ where: { id: dto.tenancyId, tenantId: dto.tenantId } });
    if (!tenancy) {
      throw new BadRequestException('Referenced tenancy does not exist in this tenant');
    }

    const payer = await this.prisma.user.findFirst({ where: { id: dto.payerId, tenantId: dto.tenantId } });
    if (!payer) {
      throw new BadRequestException('Referenced payer user does not exist in this tenant');
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: dto.tenantId,
        tenancyId: dto.tenancyId,
        payerId: dto.payerId,
        amount: dto.amount,
        currency: dto.currency ?? 'NGN',
        provider: dto.provider ?? 'flutterwave',
        reference: dto.reference,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: this.toPrismaStatus(dto.status ?? PaymentStatus.PENDING),
      },
    });

    await this.cache.delByPattern(`payments:${dto.tenantId}:*`);

    return { message: 'Payment initiated and queued for verification', payment: this.normalizePayment(payment) };
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<any> {
    const existing = await this.prisma.payment.findFirst({ where: { id: dto.paymentId, tenantId: dto.tenantId } });

    if (!existing) {
      return { message: 'Payment not found', payment: null };
    }

    const payment = await this.prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: this.toPrismaStatus(dto.status),
        verifiedAmount: dto.verifiedAmount ?? existing.amount,
      },
    });

    return { message: 'Payment status updated', payment: this.normalizePayment(payment) };
  }

  async getPaymentHistory(tenantId: string, tenancyId?: string, pagination?: any): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, ...(tenancyId ? { tenancyId } : {}) };
    if (pagination?.search) {
      where.OR = [{ reference: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy: any = pagination?.sortBy ? { [pagination.sortBy]: (pagination.order || 'desc') } : { createdAt: 'desc' };

    const cacheKey = this.cache.buildKey('payments', [tenantId, tenancyId, page, limit, pagination?.search, pagination?.sortBy, pagination?.order]);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.payment.count({ where }),
    ]);

    const result = {
      tenantId,
      payments: payments.map((payment) => this.normalizePayment(payment)),
      meta: { total, page, limit },
    };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async createPaymentSchedule(dto: CreatePaymentScheduleDto): Promise<any> {
    const tenancy = await this.prisma.tenancy.findFirst({ where: { id: dto.tenancyId, tenantId: dto.tenantId } });
    if (!tenancy) {
      throw new BadRequestException('Referenced tenancy does not exist in this tenant');
    }

    const schedule = await this.prisma.paymentSchedule.create({
      data: {
        tenantId: dto.tenantId,
        tenancyId: dto.tenancyId,
        amount: dto.amount,
        currency: dto.currency ?? 'NGN',
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
      },
    });

    await this.createNotification(
      dto.tenantId,
      null,
      `A recurring payment schedule was created for tenancy ${dto.tenancyId}`,
      'payment_schedule',
    );

    return { message: 'Payment schedule created', schedule: this.normalizeSchedule(schedule) };
  }

  async getPaymentSchedules(tenantId: string, tenancyId?: string): Promise<any> {
    const schedules = await this.prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        ...(tenancyId ? { tenancyId } : {}),
      },
    });

    return {
      tenantId,
      schedules: schedules.map((schedule) => this.normalizeSchedule(schedule)),
    };
  }

  async reconcileSchedules(tenantId: string): Promise<any> {
    const now = new Date();
    const overdueSchedules = await this.prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        nextDueDate: { lt: now },
        status: 'ACTIVE',
      },
    });

    const notifications: string[] = [];
    for (const schedule of overdueSchedules) {
      const paidPayment = await this.prisma.payment.findFirst({
        where: {
          tenantId,
          tenancyId: schedule.tenancyId,
          dueDate: schedule.nextDueDate,
          status: PrismaPaymentStatus.PAID,
        },
      });

      if (!paidPayment) {
        await this.createNotification(
          tenantId,
          null,
          `Payment due for tenancy ${schedule.tenancyId} is overdue as of ${schedule.nextDueDate.toISOString()}`,
          'payment_overdue',
        );
        notifications.push(`Overdue schedule ${schedule.id} detected`);
      }
    }

    return {
      tenantId,
      overdueSchedules: overdueSchedules.map((schedule) => this.normalizeSchedule(schedule)),
      notifications,
    };
  }

  async getPaymentsByTenant(tenantId: string): Promise<any> {
    const payments = await this.prisma.payment.findMany({ where: { tenantId } });

    return payments.map((payment) => this.normalizePayment(payment));
  }

  private toPrismaStatus(status: string): PrismaPaymentStatus {
    switch (status.toLowerCase()) {
      case 'paid':
        return PrismaPaymentStatus.PAID;
      case 'partial':
        return PrismaPaymentStatus.PARTIAL;
      case 'late':
        return PrismaPaymentStatus.LATE;
      case 'missed':
        return PrismaPaymentStatus.MISSED;
      default:
        return PrismaPaymentStatus.PENDING;
    }
  }

  private normalizePayment(payment: any) {
    return {
      ...payment,
      status: payment.status.toLowerCase(),
      dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
    };
  }

  private normalizeSchedule(schedule: any) {
    return {
      ...schedule,
      nextDueDate: schedule.nextDueDate.toISOString(),
    };
  }

  private async createNotification(
    tenantId: string,
    userId: string | null,
    message: string,
    type: string,
  ) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId,
        message,
        type,
      },
    });
  }
}
