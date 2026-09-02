import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RealtimeGateway } from '../../common/gateway/realtime.gateway';
import { buildSafeOrderBy } from '../../common/utils/sort.util';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listNotifications(params: {
    tenantId: string;
    userId?: string;
    read?: boolean;
    pagination?: any;
  }) {
    const page = params.pagination?.page ?? 1;
    const limit = params.pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: params.tenantId,
      ...(typeof params.userId === 'string' ? { userId: params.userId } : {}),
      ...(typeof params.read === 'boolean' ? { read: params.read } : {}),
    };

    const orderBy = buildSafeOrderBy(
      { sortBy: params.pagination?.sortBy, order: params.pagination?.order },
      ['createdAt', 'read', 'type'],
      { createdAt: 'desc' },
    );

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.notification.count({ where }),
    ]);

    return { tenantId: params.tenantId, notifications, meta: { total, page, limit } };
  }

  async markRead(tenantId: string, id: string, read: boolean) {
    const existing = await this.prisma.notification.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Notification not found');
    const notification = await this.prisma.notification.update({ where: { id }, data: { read } });
    this.realtime.emitNotification({ tenantId, userId: notification.userId, notification, event: 'notification:updated' });

    return { tenantId, notification };
  }

  async markAllRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });

    return { tenantId, updated: result.count };
  }
}

