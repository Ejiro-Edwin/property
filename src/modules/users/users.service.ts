import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

  async createUser(dto: CreateUserDto): Promise<any> {
    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        email: dto.email,
        role: this.toPrismaRole(dto.role),
        phone: dto.phone,
      },
    });

    await this.cache.delByPattern(`users:${dto.tenantId}:*`);

    return { message: 'User profile created', user };
  }

  async listUsers(tenantId: string, pagination?: any): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (pagination?.search) {
      where.OR = [{ name: { contains: pagination.search, mode: 'insensitive' } }, { email: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy: any = pagination?.sortBy ? { [pagination.sortBy]: (pagination.order || 'desc') } : { createdAt: 'desc' };

    const cacheKey = this.cache.buildKey('users', [tenantId, page, limit, pagination?.search, pagination?.sortBy, pagination?.order]);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.user.count({ where }),
    ]);

    const result = { tenantId, users, meta: { total, page, limit } };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getUser(tenantId: string, id: string): Promise<any> {
    const user = await this.prisma.user.findFirst({ where: { tenantId, id } });

    return { tenantId, user };
  }

  private toPrismaRole(role: string): UserRole {
    switch (role.toLowerCase()) {
      case 'landlord':
        return UserRole.LANDLORD;
      case 'letting_agent':
        return UserRole.LETTING_AGENT;
      case 'admin':
        return UserRole.ADMIN;
      default:
        return UserRole.TENANT;
    }
  }
}
