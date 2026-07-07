import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { $Enums } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { CreateUserDto, ForgotPasswordDto, ResetPasswordDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async register(dto: CreateUserDto): Promise<any> {
    const tenantId = dto.tenantId;
    const tenant = await this.prisma.tenant.upsert({
      where: { id: tenantId },
      create: {
        id: tenantId,
        name: dto.tenantId,
        slug: tenantId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
      update: {},
    });

    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: this.toPrismaRole(dto.role),
        phone: dto.phone,
      },
    });

    return {
      message: 'Tenant onboarding completed successfully',
      tenant,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user || !user.password) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return null;
    }

    return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
  }

  async login(user: any): Promise<any> {
    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const payload = { sub: user.id, tenantId: user.tenantId, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async getMe(userId: string, tenantId: string): Promise<any> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    return { user };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: dto.tenantId ? { email: dto.email, tenantId: dto.tenantId } : { email: dto.email },
    });

    if (!user) {
      return {
        message: 'If an account exists for that email, a password reset link has been issued.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: expiresAt,
      },
    });

    return {
      message: 'If an account exists for that email, a password reset link has been issued.',
      resetToken: token,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: dto.tenantId ? { resetToken: dto.token, tenantId: dto.tenantId } : { resetToken: dto.token },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { message: 'Password updated successfully' };
  }

  private toPrismaRole(role: string): $Enums.UserRole {
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
}
