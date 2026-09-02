import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(tenantId: string, userId: string) { return { tenantId, paymentMethods: await this.prisma.paymentMethod.findMany({ where: { tenantId, userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) }; }
  async create(dto: any, userId: string) {
    if (dto.isDefault) await this.prisma.paymentMethod.updateMany({ where: { tenantId: dto.tenantId, userId }, data: { isDefault: false } });
    const paymentMethod = await this.prisma.paymentMethod.create({ data: { ...dto, userId } });
    return { message: 'Payment method added', paymentMethod };
  }
  async update(tenantId: string, id: string, userId: string, dto: any) {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId, userId } });
    if (!existing) throw new NotFoundException('Payment method not found');
    if (dto.isDefault) await this.prisma.paymentMethod.updateMany({ where: { tenantId, userId }, data: { isDefault: false } });
    const paymentMethod = await this.prisma.paymentMethod.update({ where: { id }, data: { label: dto.label, isDefault: dto.isDefault } });
    return { tenantId, paymentMethod };
  }
  async remove(tenantId: string, id: string, userId: string) {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId, userId } });
    if (!existing) throw new NotFoundException('Payment method not found');
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { message: 'Payment method removed' };
  }
}
