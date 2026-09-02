import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const privileged = ['LANDLORD', 'LETTING_AGENT', 'ADMIN'];

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async findVisible(tenantId: string, id: string, actor: any) {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: { id, tenantId },
      include: { property: true, tenancy: true, requester: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');
    if (!privileged.includes(actor.role) && request.requesterId !== actor.id && request.tenancy?.tenantUserId !== actor.id) throw new NotFoundException('Maintenance request not found');
    return request;
  }

  async list(tenantId: string, actor: any, status?: string) {
    const where: any = { tenantId, ...(status ? { status } : {}) };
    if (!privileged.includes(actor.role)) where.OR = [{ requesterId: actor.id }, { tenancy: { tenantUserId: actor.id } }];
    const requests = await this.prisma.maintenanceRequest.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], include: { property: { select: { id: true, title: true } }, requester: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } } });
    return { tenantId, requests };
  }

  async get(tenantId: string, id: string, actor: any) { return { tenantId, request: await this.findVisible(tenantId, id, actor) }; }

  async create(dto: any, actor: any) {
    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, tenantId: dto.tenantId } });
      if (!property) throw new NotFoundException('Property not found');
    }
    if (dto.tenancyId) {
      const tenancy = await this.prisma.tenancy.findFirst({ where: { id: dto.tenancyId, tenantId: dto.tenantId } });
      if (!tenancy) throw new NotFoundException('Tenancy not found');
      if (dto.propertyId && tenancy.propertyId !== dto.propertyId) throw new ForbiddenException('Property does not belong to this tenancy');
      if (!privileged.includes(actor.role) && tenancy.tenantUserId !== actor.id) throw new ForbiddenException('You cannot report maintenance for this tenancy');
    } else if (!privileged.includes(actor.role) && dto.propertyId) {
      const tenancy = await this.prisma.tenancy.findFirst({ where: { tenantId: dto.tenantId, propertyId: dto.propertyId, tenantUserId: actor.id } });
      if (!tenancy) throw new ForbiddenException('You can only report maintenance for your property');
    }
    const request = await this.prisma.maintenanceRequest.create({ data: { tenantId: dto.tenantId, propertyId: dto.propertyId, tenancyId: dto.tenancyId, requesterId: actor.id, title: dto.title, description: dto.description, priority: dto.priority ?? 'normal' } });
    return { message: 'Maintenance request created', request };
  }

  async update(tenantId: string, id: string, dto: any, actor: any) {
    const existing = await this.findVisible(tenantId, id, actor);
    if (!privileged.includes(actor.role) && existing.requesterId !== actor.id) throw new ForbiddenException('You cannot update this maintenance request');
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({ where: { id: dto.assigneeId, tenantId } });
      if (!assignee) throw new NotFoundException('Assignee not found');
    }
    const request = await this.prisma.maintenanceRequest.update({ where: { id }, data: { status: dto.status, priority: dto.priority, assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId } });
    return { message: 'Maintenance request updated', request };
  }
}
