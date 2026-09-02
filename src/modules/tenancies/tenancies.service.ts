import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { $Enums, TenancyStatus as PrismaTenancyStatus } from '@prisma/client';
import { CreateTenancyDto, TenancyStatus, UpdateTenancyDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { RoleGrantsService } from '../../common/roles/role-grants.service';
import { buildSafeOrderBy } from '../../common/utils/sort.util';
import { ActorContext, isTenantRole } from '../../common/utils/role.util';

@Injectable()
export class TenanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly roleGrants: RoleGrantsService,
  ) {}

  async createTenancy(dto: CreateTenancyDto): Promise<any> {
    const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, tenantId: dto.tenantId } });
    if (!property) {
      throw new BadRequestException('Referenced property does not exist in this tenant');
    }

    const tenantUser = await this.prisma.user.findFirst({ where: { id: dto.tenantUserId, tenantId: dto.tenantId } });
    if (!tenantUser) {
      throw new BadRequestException('Referenced tenant user does not exist in this tenant');
    }

    const landlord = await this.prisma.user.findFirst({ where: { id: dto.landlordId, tenantId: dto.tenantId } });
    if (!landlord) {
      throw new BadRequestException('Referenced landlord user does not exist in this tenant');
    }

    if (dto.agentId) {
      const agent = await this.prisma.user.findFirst({ where: { id: dto.agentId, tenantId: dto.tenantId } });
      if (!agent) throw new BadRequestException('Referenced agent user does not exist in this tenant');
    }

    const tenancy = await this.prisma.tenancy.create({
      data: {
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        tenantUserId: dto.tenantUserId,
        landlordId: dto.landlordId,
        agentId: dto.agentId,
        rentAmount: dto.rentAmount,
        currency: dto.currency ?? 'NGN',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: this.toPrismaStatus(dto.status ?? TenancyStatus.ACTIVE),
      },
    });

    await Promise.all([
      this.roleGrants.ensureGrant(dto.tenantUserId, $Enums.UserRole.TENANT),
      this.roleGrants.ensureGrant(dto.landlordId, $Enums.UserRole.LANDLORD),
      dto.agentId ? this.roleGrants.ensureGrant(dto.agentId, $Enums.UserRole.LETTING_AGENT) : Promise.resolve(),
    ]);

    await this.cache.delByPattern(`tenancies:${dto.tenantId}:*`);

    return { message: 'Tenancy setup completed', tenancy };
  }

  async updateTenancy(id: string, dto: UpdateTenancyDto): Promise<any> {
    const existing = await this.prisma.tenancy.findFirst({ where: { id, tenantId: dto.tenantId } });
    if (!existing) {
      throw new NotFoundException('Tenancy not found');
    }

    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, tenantId: dto.tenantId } });
      if (!property) {
        throw new BadRequestException('Referenced property does not exist in this tenant');
      }
    }

    if (dto.tenantUserId) {
      const tenantUser = await this.prisma.user.findFirst({ where: { id: dto.tenantUserId, tenantId: dto.tenantId } });
      if (!tenantUser) {
        throw new BadRequestException('Referenced tenant user does not exist in this tenant');
      }
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

    const tenancy = await this.prisma.tenancy.update({
      where: { id },
      data: {
        propertyId: dto.propertyId ?? undefined,
        tenantUserId: dto.tenantUserId ?? undefined,
        landlordId: dto.landlordId ?? undefined,
        agentId: dto.agentId === undefined ? undefined : dto.agentId,
        rentAmount: dto.rentAmount ?? undefined,
        currency: dto.currency ?? undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ? this.toPrismaStatus(dto.status) : undefined,
      },
    });

    await Promise.all([
      dto.tenantUserId
        ? this.roleGrants.ensureGrant(dto.tenantUserId, $Enums.UserRole.TENANT)
        : Promise.resolve(),
      dto.landlordId
        ? this.roleGrants.ensureGrant(dto.landlordId, $Enums.UserRole.LANDLORD)
        : Promise.resolve(),
      dto.agentId
        ? this.roleGrants.ensureGrant(dto.agentId, $Enums.UserRole.LETTING_AGENT)
        : Promise.resolve(),
    ]);

    await this.cache.delByPattern(`tenancies:${dto.tenantId}:*`);
    return { message: 'Tenancy updated', tenancy };
  }

  async deleteTenancy(tenantId: string, id: string): Promise<any> {
    const existing = await this.prisma.tenancy.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Tenancy not found');
    }

    await this.prisma.tenancy.delete({ where: { id } });
    await this.cache.delByPattern(`tenancies:${tenantId}:*`);
    await this.cache.delByPattern(`payments:${tenantId}:*`);
    return { message: 'Tenancy deleted' };
  }

  async listTenancies(tenantId: string, pagination?: any, actor?: ActorContext): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (actor && isTenantRole(actor.role)) {
      where.tenantUserId = actor.id;
    }
    if (pagination?.search) {
      const raw = String(pagination.search).trim().toLowerCase();
      const statusMap: Record<string, PrismaTenancyStatus> = {
        pending: PrismaTenancyStatus.PENDING,
        active: PrismaTenancyStatus.ACTIVE,
        ended: PrismaTenancyStatus.ENDED,
      };

      if (statusMap[raw]) {
        where.status = statusMap[raw];
      } else {
        where.OR = [
          { propertyId: { contains: raw, mode: 'insensitive' } },
          { tenantUserId: { contains: raw, mode: 'insensitive' } },
          { landlordId: { contains: raw, mode: 'insensitive' } },
          { agentId: { contains: raw, mode: 'insensitive' } },
        ];
      }
    }

    const orderBy = buildSafeOrderBy(
      { sortBy: pagination?.sortBy, order: pagination?.order },
      ['createdAt', 'startDate', 'endDate', 'rentAmount', 'currency', 'status', 'updatedAt'],
      { createdAt: 'desc' },
    );

    const cacheKey = this.cache.buildKey('tenancies', [
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

    const [tenancies, total] = await Promise.all([
      this.prisma.tenancy.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.tenancy.count({ where }),
    ]);

    const result = { tenantId, tenancies, meta: { total, page, limit } };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async listTenanciesByTenant(tenantId: string): Promise<any> {
    return this.prisma.tenancy.findMany({ where: { tenantId } });
  }

  async getTenancy(tenantId: string, id: string, actor?: ActorContext): Promise<any> {
    const where: any = { id, tenantId };
    if (actor && isTenantRole(actor.role)) where.tenantUserId = actor.id;
    const tenancy = await this.prisma.tenancy.findFirst({
      where,
      include: {
        property: { include: { amenities: true, rules: true } },
        tenantUser: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    return { tenantId, tenancy };
  }

  private toPrismaStatus(status: string): PrismaTenancyStatus {
    switch (status.toLowerCase()) {
      case 'pending':
        return PrismaTenancyStatus.PENDING;
      case 'ended':
        return PrismaTenancyStatus.ENDED;
      default:
        return PrismaTenancyStatus.ACTIVE;
    }
  }
}
