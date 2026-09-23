import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { CreatePropertyAmenityDto, CreatePropertyDto, CreatePropertyRuleDto, UpdatePropertyDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { RoleGrantsService } from '../../common/roles/role-grants.service';
import { buildSafeOrderBy } from '../../common/utils/sort.util';
import { ActorContext, isTenantRole } from '../../common/utils/role.util';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly roleGrants: RoleGrantsService,
  ) {}

  async createProperty(dto: CreatePropertyDto): Promise<any> {
    const landlord = await this.prisma.user.findFirst({ where: { id: dto.landlordId, tenantId: dto.tenantId } });
    if (!landlord) {
      throw new BadRequestException('Referenced landlord user does not exist in this tenant');
    }

    if (dto.agentId) {
      const agent = await this.prisma.user.findFirst({ where: { id: dto.agentId, tenantId: dto.tenantId } });
      if (!agent) {
        throw new BadRequestException('Referenced agent user does not exist in this tenant');
      }
    }

    const property = await this.prisma.property.create({
      data: {
        tenantId: dto.tenantId,
        title: dto.title,
        address: dto.address,
        landlordId: dto.landlordId,
        agentId: dto.agentId,
        bedrooms: dto.bedrooms,
        rentAmount: dto.rentAmount,
        currency: dto.currency ?? 'NGN',
        amenities: dto.amenities?.length
          ? { create: [...new Set(dto.amenities.map((name) => name.trim()).filter(Boolean))].map((name) => ({ tenantId: dto.tenantId, name })) }
          : undefined,
      },
      include: { amenities: true, rules: true },
    });

    await Promise.all([
      this.roleGrants.ensureGrant(dto.landlordId, $Enums.UserRole.LANDLORD),
      dto.agentId ? this.roleGrants.ensureGrant(dto.agentId, $Enums.UserRole.LETTING_AGENT) : Promise.resolve(),
    ]);

    await this.cache.delByPattern(`properties:${dto.tenantId}:*`);

    return { message: 'Property created for tenant', property };
  }

  async updateProperty(id: string, dto: UpdatePropertyDto): Promise<any> {
    const existing = await this.prisma.property.findFirst({ where: { id, tenantId: dto.tenantId } });
    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    if (dto.landlordId) {
      const landlord = await this.prisma.user.findFirst({ where: { id: dto.landlordId, tenantId: dto.tenantId } });
      if (!landlord) {
        throw new BadRequestException('Referenced landlord user does not exist in this tenant');
      }
    }

    if (dto.agentId !== undefined && dto.agentId !== null) {
      const agent = await this.prisma.user.findFirst({ where: { id: dto.agentId, tenantId: dto.tenantId } });
      if (!agent) {
        throw new BadRequestException('Referenced agent user does not exist in this tenant');
      }
    }

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        address: dto.address ?? undefined,
        landlordId: dto.landlordId ?? undefined,
        agentId: dto.agentId === undefined ? undefined : dto.agentId,
        bedrooms: dto.bedrooms ?? undefined,
        rentAmount: dto.rentAmount ?? undefined,
        currency: dto.currency ?? undefined,
      },
    });

    await Promise.all([
      dto.landlordId
        ? this.roleGrants.ensureGrant(dto.landlordId, $Enums.UserRole.LANDLORD)
        : Promise.resolve(),
      dto.agentId !== undefined && dto.agentId !== null
        ? this.roleGrants.ensureGrant(dto.agentId, $Enums.UserRole.LETTING_AGENT)
        : Promise.resolve(),
    ]);

    await this.cache.delByPattern(`properties:${dto.tenantId}:*`);
    return { message: 'Property updated', property };
  }

  async deleteProperty(tenantId: string, id: string): Promise<any> {
    const existing = await this.prisma.property.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.delete({ where: { id } });
    await this.cache.delByPattern(`properties:${tenantId}:*`);
    await this.cache.delByPattern(`tenancies:${tenantId}:*`);
    return { message: 'Property deleted' };
  }

  async addAmenity(propertyId: string, dto: CreatePropertyAmenityDto): Promise<any> {
    await this.assertProperty(dto.tenantId, propertyId);
    const amenity = await this.prisma.propertyAmenity.create({
      data: { tenantId: dto.tenantId, propertyId, name: dto.name.trim() },
    });
    return { message: 'Amenity added', amenity };
  }

  async removeAmenity(propertyId: string, amenityId: string, tenantId: string): Promise<any> {
    await this.assertProperty(tenantId, propertyId);
    const amenity = await this.prisma.propertyAmenity.findFirst({ where: { id: amenityId, propertyId, tenantId } });
    if (!amenity) throw new NotFoundException('Amenity not found');
    await this.prisma.propertyAmenity.delete({ where: { id: amenityId } });
    return { message: 'Amenity removed' };
  }

  async addRule(propertyId: string, dto: CreatePropertyRuleDto): Promise<any> {
    await this.assertProperty(dto.tenantId, propertyId);
    const rule = await this.prisma.propertyRule.create({
      data: { tenantId: dto.tenantId, propertyId, title: dto.title.trim(), details: dto.details?.trim() || undefined },
    });
    return { message: 'Rule added', rule };
  }

  async removeRule(propertyId: string, ruleId: string, tenantId: string): Promise<any> {
    await this.assertProperty(tenantId, propertyId);
    const rule = await this.prisma.propertyRule.findFirst({ where: { id: ruleId, propertyId, tenantId } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.prisma.propertyRule.delete({ where: { id: ruleId } });
    return { message: 'Rule removed' };
  }

  private async assertProperty(tenantId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, tenantId } });
    if (!property) throw new NotFoundException('Property not found');
  }

  async listProperties(tenantId: string, pagination?: any, actor?: ActorContext): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (actor && isTenantRole(actor.role)) {
      const tenancies = await this.prisma.tenancy.findMany({
        where: { tenantId, tenantUserId: actor.id },
        select: { propertyId: true },
      });
      const propertyIds = [...new Set(tenancies.map((t) => t.propertyId))];
      where.id = { in: propertyIds.length > 0 ? propertyIds : ['__none__'] };
    }
    if (pagination?.search) {
      where.OR = [{ title: { contains: pagination.search, mode: 'insensitive' } }, { address: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy = buildSafeOrderBy(
      { sortBy: pagination?.sortBy, order: pagination?.order },
      ['createdAt', 'title', 'address', 'bedrooms', 'rentAmount', 'currency', 'updatedAt'],
      { createdAt: 'desc' },
    );

    const cacheKey = this.cache.buildKey('properties', [
      tenantId,
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

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.property.count({ where }),
    ]);

    const result = { tenantId, properties, meta: { total, page, limit } };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getProperty(tenantId: string, id: string, actor?: ActorContext): Promise<any> {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId },
      include: { amenities: true, rules: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (actor && isTenantRole(actor.role)) {
      const tenancy = await this.prisma.tenancy.findFirst({ where: { tenantId, propertyId: id, tenantUserId: actor.id } });
      if (!tenancy) throw new NotFoundException('Property not found');
    }
    return { tenantId, property };
  }
}
