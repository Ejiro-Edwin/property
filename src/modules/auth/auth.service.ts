import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { $Enums } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  ForgotPasswordDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { RoleGrantsService } from '../../common/roles/role-grants.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly email: EmailService,
    private readonly roleGrants: RoleGrantsService,
  ) {}

  /**
   * Registration creates a NEW workspace with the registrant as its landlord.
   * Joining an existing workspace happens exclusively through invitations.
   */
  async register(dto: RegisterDto): Promise<any> {
    const tenantId = dto.tenantId
      ? dto.tenantId
      : await this.allocateTenantId(dto.email, dto.workspaceName);
    const slug = tenantId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await this.prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug }] },
    });
    if (existing) {
      throw new BadRequestException(
        'This workspace already exists. Ask a workspace admin to send you an invitation instead.',
      );
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        id: tenantId,
        name: dto.workspaceName?.trim() || dto.name?.trim() || tenantId,
        slug,
      },
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
        role: $Enums.UserRole.LANDLORD,
        phone: dto.phone,
      },
    });

    await this.roleGrants.seedInitialGrant(user.id, $Enums.UserRole.LANDLORD);

    const frontendUrl = process.env.FRONTEND_URL;
    const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
    const verifyLink = frontendUrl
      ? `${base}/verify-email?token=${verificationToken}&tenantId=${encodeURIComponent(tenant.id)}`
      : `token:${verificationToken}`;

    await this.email.sendEmailVerificationEmail({ to: dto.email, verifyLink });

    return {
      message: 'Workspace created successfully',
      tenant,
      user: this.formatAuthUser(user, [$Enums.UserRole.LANDLORD]),
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

    const profiles = await this.roleGrants.syncProfileGrants(user.id, user.tenantId);
    const payload = { sub: user.id, tenantId: user.tenantId, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.formatAuthUser(user, profiles),
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
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profiles = await this.roleGrants.syncProfileGrants(userId, tenantId);
    return {
      user: {
        ...user,
        role: this.roleGrants.toApiRole(user.role),
        activeRole: this.roleGrants.toApiRole(user.role),
      },
      profiles,
    };
  }

  async switchProfile(userId: string, tenantId: string, targetRole: string) {
    this.roleGrants.assertSwitchableRole(targetRole);
    const { user, profiles } = await this.roleGrants.activateProfile(userId, tenantId, targetRole);
    const prismaRole = this.roleGrants.toPrismaRole(targetRole);
    const payload = { sub: user.id, tenantId: user.tenantId, email: user.email, role: prismaRole };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
      profiles,
      message: `Switched to ${this.roleGrants.profileLabel(targetRole)} profile`,
    };
  }

  private formatAuthUser(
    user: { id: string; email: string; tenantId: string; role: $Enums.UserRole | string },
    profileRoles: Array<$Enums.UserRole | string>,
  ) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: this.roleGrants.toApiRole(user.role),
      activeRole: this.roleGrants.toApiRole(user.role),
      profiles: profileRoles.map((p) => this.roleGrants.toApiRole(p)),
    };
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

  private normalizeTenantHandle(raw: string): string {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    if (normalized.length < 2) {
      return '';
    }
    let handle = normalized;
    if (!/^[a-z0-9]/.test(handle)) {
      handle = `w-${handle}`.slice(0, 40);
    }
    if (!/[a-z0-9]$/.test(handle)) {
      handle = `${handle}0`.slice(0, 40);
    }
    return handle.length >= 2 ? handle : '';
  }

  private async isTenantIdAvailable(tenantId: string): Promise<boolean> {
    const slug = tenantId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug }] },
      select: { id: true },
    });
    return !existing;
  }

  private async allocateTenantId(email: string, workspaceName?: string): Promise<string> {
    const seeds = [
      workspaceName ? this.normalizeTenantHandle(workspaceName) : '',
      this.normalizeTenantHandle(email.split('@')[0] ?? ''),
    ].filter(Boolean);

    for (const base of seeds) {
      if (await this.isTenantIdAvailable(base)) {
        return base;
      }
      for (let i = 0; i < 8; i++) {
        const suffix = randomBytes(2).toString('hex');
        const candidate = this.normalizeTenantHandle(`${base}-${suffix}`);
        if (candidate && (await this.isTenantIdAvailable(candidate))) {
          return candidate;
        }
      }
    }

    for (let i = 0; i < 8; i++) {
      const candidate = `ws-${randomBytes(4).toString('hex')}`;
      if (await this.isTenantIdAvailable(candidate)) {
        return candidate;
      }
    }

    throw new BadRequestException('Could not allocate a workspace id. Try again.');
  }
}
