import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { tenantId: string; propertyId?: string; tenancyId?: string; actor: any }) {
    const privileged = ['LANDLORD', 'LETTING_AGENT', 'ADMIN'].includes(params.actor.role);
    const where: any = { tenantId: params.tenantId, ...(params.propertyId ? { propertyId: params.propertyId } : {}), ...(params.tenancyId ? { tenancyId: params.tenancyId } : {}) };
    if (!privileged) {
      const tenancies = await this.prisma.tenancy.findMany({ where: { tenantId: params.tenantId, tenantUserId: params.actor.id }, select: { id: true, propertyId: true } });
      where.OR = [{ ownerId: params.actor.id }, { visibility: 'WORKSPACE' }, { access: { some: { userId: params.actor.id } } }, { tenancyId: { in: tenancies.map((t) => t.id) } }, { propertyId: { in: tenancies.map((t) => t.propertyId) } }];
    }
    const documents = await this.prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, include: { uploadedBy: { select: { id: true, name: true } } } });
    return { tenantId: params.tenantId, documents };
  }

  async create(dto: any, actor: any) {
    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, tenantId: dto.tenantId } });
      if (!property) throw new NotFoundException('Property not found');
    }
    if (dto.tenancyId) {
      const tenancy = await this.prisma.tenancy.findFirst({ where: { id: dto.tenancyId, tenantId: dto.tenantId } });
      if (!tenancy) throw new NotFoundException('Tenancy not found');
      if (dto.propertyId && tenancy.propertyId !== dto.propertyId) throw new ForbiddenException('Property does not belong to this tenancy');
      if (dto.ownerId && dto.ownerId !== tenancy.tenantUserId && dto.ownerId !== tenancy.landlordId) throw new ForbiddenException('Document owner is not linked to this tenancy');
    }
    if (dto.ownerId) {
      const owner = await this.prisma.user.findFirst({ where: { id: dto.ownerId, tenantId: dto.tenantId } });
      if (!owner) throw new NotFoundException('Document owner not found');
    }
    const document = await this.prisma.document.create({ data: { ...dto, visibility: dto.visibility ?? 'PRIVATE', uploadedById: actor.id } });
    return { message: 'Document uploaded', document };
  }

  async remove(tenantId: string, id: string, actor: any) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) throw new NotFoundException('Document not found');
    if (document.uploadedById !== actor.id && !['LANDLORD', 'LETTING_AGENT', 'ADMIN'].includes(actor.role)) throw new ForbiddenException('You cannot delete this document');
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  async share(tenantId: string, id: string, dto: { userId: string; canEdit?: boolean }) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) throw new NotFoundException('Document not found');
    const user = await this.prisma.user.findFirst({ where: { id: dto.userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    const access = await this.prisma.documentAccess.upsert({ where: { documentId_userId: { documentId: id, userId: dto.userId } }, update: { canEdit: dto.canEdit ?? false }, create: { documentId: id, userId: dto.userId, canEdit: dto.canEdit ?? false } });
    return { message: 'Document shared', access };
  }

  async changeVisibility(tenantId: string, id: string, visibility: string, actor: any) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) throw new NotFoundException('Document not found');
    if (document.uploadedById !== actor.id && !['LANDLORD', 'LETTING_AGENT', 'ADMIN'].includes(actor.role)) throw new ForbiddenException('You cannot change this document visibility');
    const updated = await this.prisma.document.update({ where: { id }, data: { visibility } });
    return { message: 'Document visibility updated', document: updated };
  }
}
