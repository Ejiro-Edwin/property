import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PropertyFeaturesService {
  constructor(private readonly prisma: PrismaService) {}
  private async property(tenantId: string, propertyId: string) { const property = await this.prisma.property.findFirst({ where: { id: propertyId, tenantId } }); if (!property) throw new NotFoundException('Property not found'); return property; }
  async listAmenities(tenantId: string, propertyId: string) { await this.property(tenantId, propertyId); return { tenantId, amenities: await this.prisma.propertyAmenity.findMany({ where: { tenantId, propertyId }, orderBy: { name: 'asc' } }) }; }
  async listRules(tenantId: string, propertyId: string) { await this.property(tenantId, propertyId); return { tenantId, rules: await this.prisma.propertyRule.findMany({ where: { tenantId, propertyId }, orderBy: { createdAt: 'asc' } }) }; }
  async addAmenity(tenantId: string, propertyId: string, name: string) { await this.property(tenantId, propertyId); const amenity = await this.prisma.propertyAmenity.upsert({ where: { propertyId_name: { propertyId, name } }, update: {}, create: { tenantId, propertyId, name } }); return { message: 'Amenity added', amenity }; }
  async addRule(tenantId: string, propertyId: string, title: string, details?: string) { await this.property(tenantId, propertyId); const rule = await this.prisma.propertyRule.create({ data: { tenantId, propertyId, title, details } }); return { message: 'Rule added', rule }; }
  async removeAmenity(tenantId: string, id: string) { const item = await this.prisma.propertyAmenity.findFirst({ where: { id, tenantId } }); if (!item) throw new NotFoundException('Amenity not found'); await this.prisma.propertyAmenity.delete({ where: { id } }); return { message: 'Amenity removed' }; }
  async removeRule(tenantId: string, id: string) { const item = await this.prisma.propertyRule.findFirst({ where: { id, tenantId } }); if (!item) throw new NotFoundException('Rule not found'); await this.prisma.propertyRule.delete({ where: { id } }); return { message: 'Rule removed' }; }
}
