import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { $Enums, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RoleGrantsService {
  constructor(private readonly prisma: PrismaService) {}

  toApiRole(role: UserRole | string): string {
    return String(role).toLowerCase();
  }

  toPrismaRole(role: string): UserRole {
    switch (role.toLowerCase()) {
      case 'landlord':
        return $Enums.UserRole.LANDLORD;
      case 'letting_agent':
        return $Enums.UserRole.LETTING_AGENT;
      case 'admin':
        return $Enums.UserRole.ADMIN;
      default:
        return $Enums.UserRole.TENANT;
    }
  }

  async ensureGrant(userId: string, role: UserRole): Promise<void> {
    await this.prisma.userRoleGrant.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: {},
    });
  }

  async listGrantRoles(userId: string): Promise<UserRole[]> {
    const grants = await this.prisma.userRoleGrant.findMany({
      where: { userId },
      select: { role: true },
      orderBy: { role: 'asc' },
    });
    return grants.map((g) => g.role);
  }

  async listApiProfiles(userId: string): Promise<string[]> {
    return (await this.listGrantRoles(userId)).map((r) => this.toApiRole(r));
  }

  /**
   * Derive operating profiles from tenancy/property relationships and persist grants.
   * A user may hold landlord, agent and tenant profiles concurrently (e.g. a landlord who rents elsewhere).
   */
  async syncProfileGrants(userId: string, tenantId: string): Promise<string[]> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) {
      return [];
    }

    await this.ensureGrant(userId, user.role);

    const [tenanciesAsTenant, tenanciesAsLandlord, tenanciesAsAgent, propertiesAsLandlord, propertiesAsAgent] =
      await Promise.all([
        this.prisma.tenancy.count({ where: { tenantUserId: userId, tenantId } }),
        this.prisma.tenancy.count({ where: { landlordId: userId, tenantId } }),
        this.prisma.tenancy.count({ where: { agentId: userId, tenantId } }),
        this.prisma.property.count({ where: { landlordId: userId, tenantId } }),
        this.prisma.property.count({ where: { agentId: userId, tenantId } }),
      ]);

    if (tenanciesAsTenant > 0) {
      await this.ensureGrant(userId, $Enums.UserRole.TENANT);
    }
    if (tenanciesAsLandlord > 0 || propertiesAsLandlord > 0) {
      await this.ensureGrant(userId, $Enums.UserRole.LANDLORD);
    }
    if (tenanciesAsAgent > 0 || propertiesAsAgent > 0) {
      await this.ensureGrant(userId, $Enums.UserRole.LETTING_AGENT);
    }
    if (user.role === $Enums.UserRole.ADMIN) {
      await this.ensureGrant(userId, $Enums.UserRole.ADMIN);
    }

    return this.listApiProfiles(userId);
  }

  async assertCanActivate(userId: string, targetRole: string): Promise<UserRole> {
    const prismaRole = this.toPrismaRole(targetRole);
    const grant = await this.prisma.userRoleGrant.findUnique({
      where: { userId_role: { userId, role: prismaRole } },
    });
    if (!grant) {
      throw new ForbiddenException(
        `You do not have the "${this.toApiRole(prismaRole)}" operating profile in this workspace`,
      );
    }
    return prismaRole;
  }

  async activateProfile(userId: string, tenantId: string, targetRole: string) {
    const profiles = await this.syncProfileGrants(userId, tenantId);
    const prismaRole = await this.assertCanActivate(userId, targetRole);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: prismaRole },
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

    return {
      user: {
        ...user,
        role: this.toApiRole(user.role),
        activeRole: this.toApiRole(user.role),
      },
      profiles,
    };
  }

  async seedInitialGrant(userId: string, role: UserRole): Promise<void> {
    await this.ensureGrant(userId, role);
  }

  async addGrantForRoleChange(userId: string, role: UserRole): Promise<void> {
    await this.ensureGrant(userId, role);
  }

  profileLabel(role: string): string {
    switch (role.toLowerCase()) {
      case 'landlord':
        return 'Landlord';
      case 'tenant':
        return 'Tenant';
      case 'letting_agent':
        return 'Agent';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  }

  assertSwitchableRole(role: string): void {
    const allowed = ['tenant', 'landlord', 'letting_agent', 'admin'];
    if (!allowed.includes(role.toLowerCase())) {
      throw new BadRequestException('Invalid operating profile');
    }
  }
}
