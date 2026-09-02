import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client';
import {
  CreatePaymentScheduleDto,
  InitiatePaymentDto,
  PaymentStatus,
  VerifyPaymentDto,
} from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { buildSafeOrderBy } from '../../common/utils/sort.util';
import { ActorContext, isTenantRole } from '../../common/utils/role.util';
import { RealtimeGateway } from '../../common/gateway/realtime.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto, actor?: ActorContext): Promise<any> {
    const tenancy = await this.prisma.tenancy.findFirst({ where: { id: dto.tenancyId, tenantId: dto.tenantId } });
    if (!tenancy) {
      throw new BadRequestException('Referenced tenancy does not exist in this tenant');
    }

    const payer = await this.prisma.user.findFirst({ where: { id: dto.payerId, tenantId: dto.tenantId } });
    if (!payer) {
      throw new BadRequestException('Referenced payer user does not exist in this tenant');
    }
    if (tenancy.tenantUserId !== payer.id) {
      throw new BadRequestException('Payer must be the tenant assigned to this tenancy');
    }

    if (actor && isTenantRole(actor.role)) {
      if (dto.payerId !== actor.id || tenancy.tenantUserId !== actor.id) {
        throw new BadRequestException('You can only record payments for your own tenancy');
      }
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
      throw new NotFoundException('Payment not found');
    }

    const payment = await this.prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: this.toPrismaStatus(dto.status),
        verifiedAmount: dto.verifiedAmount ?? existing.amount,
      },
    });

    await this.cache.delByPattern(`payments:${dto.tenantId}:*`);
    this.realtime.emitPaymentUpdate({
      tenantId: dto.tenantId,
      payment: this.normalizePayment(payment),
      event: 'payment:updated',
    });
    return { message: 'Payment status updated', payment: this.normalizePayment(payment) };
  }

  async getPaymentHistory(
    tenantId: string,
    tenancyId?: string,
    pagination?: any,
    actor?: ActorContext,
  ): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, ...(tenancyId ? { tenancyId } : {}) };
    if (actor && isTenantRole(actor.role)) {
      where.payerId = actor.id;
      const ownTenancies = await this.prisma.tenancy.findMany({ where: { tenantId, tenantUserId: actor.id }, select: { id: true } });
      const ownTenancyIds = ownTenancies.map((t) => t.id);
      where.tenancyId = tenancyId
        ? ownTenancyIds.includes(tenancyId) ? tenancyId : '__none__'
        : { in: ownTenancyIds.length ? ownTenancyIds : ['__none__'] };
    }
    if (pagination?.search) {
      where.OR = [{ reference: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy = buildSafeOrderBy(
      { sortBy: pagination?.sortBy, order: pagination?.order },
      ['createdAt', 'amount', 'currency', 'provider', 'reference', 'status', 'dueDate', 'updatedAt'],
      { createdAt: 'desc' },
    );

    const cacheKey = this.cache.buildKey('payments', [
      tenantId,
      tenancyId,
      actor?.id,
      actor?.role,
      page,
      limit,
      pagination?.search,
      pagination?.sortBy,
      pagination?.order,
    ]);
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
      tenancy.landlordId ?? null,
      `A recurring payment schedule was created for tenancy ${dto.tenancyId}`,
      'payment_schedule',
    );

    return { message: 'Payment schedule created', schedule: this.normalizeSchedule(schedule) };
  }

  async getPaymentSchedules(tenantId: string, tenancyId?: string, actor?: ActorContext): Promise<any> {
    const where: any = {
      tenantId,
      ...(tenancyId ? { tenancyId } : {}),
    };

    if (actor && isTenantRole(actor.role)) {
      const tenancies = await this.prisma.tenancy.findMany({
        where: { tenantId, tenantUserId: actor.id },
        select: { id: true },
      });
      const tenancyIds = tenancies.map((t) => t.id);
      where.tenancyId = tenancyId
        ? tenancyIds.includes(tenancyId)
          ? tenancyId
          : '__none__'
        : { in: tenancyIds.length > 0 ? tenancyIds : ['__none__'] };
    }

    const schedules = await this.prisma.paymentSchedule.findMany({ where });

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

    const tenancyIds = Array.from(new Set(overdueSchedules.map((s) => s.tenancyId)));
    const tenancies = tenancyIds.length
      ? await this.prisma.tenancy.findMany({
          where: { tenantId, id: { in: tenancyIds } },
          select: { id: true, landlordId: true },
        })
      : [];
    const landlordByTenancyId = new Map(tenancies.map((t) => [t.id, t.landlordId]));

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
          landlordByTenancyId.get(schedule.tenancyId) ?? null,
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
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId,
        message,
        type,
      },
    });

    this.realtime.emitNotification({
      tenantId,
      userId,
      notification,
      event: 'notification:created',
    });

    return notification;
  }
}
