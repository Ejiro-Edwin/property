import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePropertyDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

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
      },
    });

    await this.cache.delByPattern(`properties:${dto.tenantId}:*`);

    return { message: 'Property created for tenant', property };
  }

  async listProperties(tenantId: string, pagination?: any): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (pagination?.search) {
      where.OR = [{ title: { contains: pagination.search, mode: 'insensitive' } }, { address: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy: any = pagination?.sortBy ? { [pagination.sortBy]: (pagination.order || 'desc') } : { createdAt: 'desc' };

    const cacheKey = this.cache.buildKey('properties', [tenantId, page, limit, pagination?.search, pagination?.sortBy, pagination?.order]);
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
}
