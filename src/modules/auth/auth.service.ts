import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { $Enums } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  CreateUserDto,
  ForgotPasswordDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly email: EmailService,
  ) {}

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

    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
        role: this.toPrismaRole(dto.role),
        phone: dto.phone,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
    const verifyLink = frontendUrl
      ? `${base}/verify-email?token=${verificationToken}${
          dto.tenantId ? `&tenantId=${encodeURIComponent(dto.tenantId)}` : ''
        }`
      : `token:${verificationToken}`;

    await this.email.sendEmailVerificationEmail({ to: dto.email, verifyLink });

    return {
      message: 'Tenant onboarding completed successfully',
      tenant,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  async validateUser(email: string, password: string, tenantId?: string): Promise<any> {
    const user = tenantId
      ? await this.prisma.user.findFirst({ where: { email, tenantId } })
      : await this.resolveUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return null;
    }

    const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireEmailVerification && !user.emailVerified) {
      throw new UnauthorizedException('Email address is not verified');
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
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
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

    const frontendUrl = process.env.FRONTEND_URL;
    const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
    const resetLink = frontendUrl
      ? `${base}/reset-password?token=${token}${dto.tenantId ? `&tenantId=${encodeURIComponent(dto.tenantId)}` : ''}`
      : `token:${token}`;

    await this.email.sendPasswordResetEmail({ to: dto.email, resetLink, tenantId: dto.tenantId });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`Password reset token issued for ${dto.email}: ${token}`);
    }

    return { message: 'If an account exists for that email, a password reset link has been issued.' };
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

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: dto.tenantId
        ? { tenantId: dto.tenantId, emailVerificationToken: dto.token }
        : { emailVerificationToken: dto.token },
    });

    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('Verification token is invalid or has expired');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    await this.email.sendWelcomeEmail({ to: updated.email });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findFirst({
      where: dto.tenantId ? { tenantId: dto.tenantId, email: dto.email } : { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account exists for that email, a verification link has been issued.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpiresAt: expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
    const verifyLink = frontendUrl
      ? `${base}/verify-email?token=${token}${dto.tenantId ? `&tenantId=${encodeURIComponent(dto.tenantId)}` : ''}`
      : `token:${token}`;

    await this.email.sendEmailVerificationEmail({ to: dto.email, verifyLink });

    return { message: 'If an account exists for that email, a verification link has been issued.' };
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

  private async resolveUserByEmail(email: string) {
    const users = await this.prisma.user.findMany({
      where: { email },
      select: { id: true, tenantId: true, email: true, password: true, role: true, emailVerified: true },
      take: 2,
    });

    if (users.length === 0) {
      return null;
    }

    if (users.length > 1) {
      throw new BadRequestException('Multiple accounts found for this email. Provide tenantId to login.');
    }

    return users[0];
  }
}
