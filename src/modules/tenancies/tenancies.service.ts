import { BadRequestException, Injectable } from '@nestjs/common';
import { TenancyStatus as PrismaTenancyStatus } from '@prisma/client';
import { CreateTenancyDto, TenancyStatus } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class TenanciesService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

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

    await this.cache.delByPattern(`tenancies:${dto.tenantId}:*`);

    return { message: 'Tenancy setup completed', tenancy };
  }

  async listTenancies(tenantId: string, pagination?: any): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (pagination?.search) {
      where.OR = [{ status: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy: any = pagination?.sortBy ? { [pagination.sortBy]: (pagination.order || 'desc') } : { createdAt: 'desc' };

    const cacheKey = this.cache.buildKey('tenancies', [tenantId, page, limit, pagination?.search, pagination?.sortBy, pagination?.order]);
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
