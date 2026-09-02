import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(tenantId: string, actor: any, unread?: boolean) {
    const privileged = ['LANDLORD', 'LETTING_AGENT', 'ADMIN'].includes(actor.role);
    const where: any = { tenantId, ...(typeof unread === 'boolean' ? { read: !unread } : {}) };
    if (!privileged) where.OR = [{ senderId: actor.id }, { recipientId: actor.id }];
    const messages = await this.prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true } }, recipient: { select: { id: true, name: true } } } });
    return { tenantId, messages };
  }
  async create(dto: any, actor: any) {
    if (dto.recipientId) {
      const recipient = await this.prisma.user.findFirst({ where: { id: dto.recipientId, tenantId: dto.tenantId } });
      if (!recipient) throw new NotFoundException('Recipient not found');
    }
    const message = await this.prisma.message.create({ data: { tenantId: dto.tenantId, senderId: actor.id, recipientId: dto.recipientId, body: dto.body } });
    return { message: 'Message sent', data: message };
  }
  async markRead(tenantId: string, id: string, actor: any, read: boolean) {
    const existing = await this.prisma.message.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Message not found');
    if (existing.recipientId !== actor.id && !['LANDLORD', 'LETTING_AGENT', 'ADMIN'].includes(actor.role)) throw new ForbiddenException('You cannot update this message');
    const message = await this.prisma.message.update({ where: { id }, data: { read } });
    return { tenantId, message };
  }
}
