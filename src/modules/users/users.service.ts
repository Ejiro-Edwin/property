import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { buildSafeOrderBy } from '../../common/utils/sort.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

  async createUser(dto: CreateUserDto): Promise<any> {
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: this.toPrismaRole(dto.role),
        phone: dto.phone,
      },
    });

    await this.cache.delByPattern(`users:${dto.tenantId}:*`);

    return { message: 'User profile created', user };
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<any> {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId: dto.tenantId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== existing.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { tenantId: dto.tenantId, email: dto.email, NOT: { id } },
      });
      if (conflict) {
        throw new BadRequestException('A user with that email already exists in this workspace');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        role: dto.role ? this.toPrismaRole(dto.role) : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.cache.delByPattern(`users:${dto.tenantId}:*`);
    return { message: 'User updated', user };
  }

  async deleteUser(tenantId: string, id: string): Promise<any> {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    await this.cache.delByPattern(`users:${tenantId}:*`);
    return { message: 'User deleted' };
  }

  async listUsers(tenantId: string, pagination?: any): Promise<any> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (pagination?.search) {
      where.OR = [{ name: { contains: pagination.search, mode: 'insensitive' } }, { email: { contains: pagination.search, mode: 'insensitive' } }];
    }

    const orderBy = buildSafeOrderBy(
      { sortBy: pagination?.sortBy, order: pagination?.order },
      ['createdAt', 'name', 'email', 'role', 'phone', 'updatedAt'],
      { createdAt: 'desc' },
    );

    const cacheKey = this.cache.buildKey('users', [tenantId, page, limit, pagination?.search, pagination?.sortBy, pagination?.order]);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          tenantId: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const result = { tenantId, users, meta: { total, page, limit } };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getUser(tenantId: string, id: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
