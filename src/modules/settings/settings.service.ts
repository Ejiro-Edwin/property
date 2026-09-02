import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string, userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
    return { tenantId, settings: settings ?? { leasePreferences: {}, paymentPreferences: {}, notificationPreferences: {}, privacyPreferences: {} } };
  }

  async update(tenantId: string, userId: string, dto: any) {
    const settings = await this.prisma.userSettings.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: { tenantId, userId, leasePreferences: dto.leasePreferences ?? {}, paymentPreferences: dto.paymentPreferences ?? {}, notificationPreferences: dto.notificationPreferences ?? {}, privacyPreferences: dto.privacyPreferences ?? {} },
      update: { leasePreferences: dto.leasePreferences, paymentPreferences: dto.paymentPreferences, notificationPreferences: dto.notificationPreferences, privacyPreferences: dto.privacyPreferences },
    });
    return { message: 'Settings updated', tenantId, settings };
  }
}
