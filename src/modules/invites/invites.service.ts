import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AcceptInviteDto, CreateInviteDto } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email/email.service';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async createInvite(dto: CreateInviteDto, inviter: { id: string; role: string; name?: string }) {
    const role = this.toPrismaRole(dto.role);

    // Letting agents may only invite tenants; landlords/admins can invite anyone.
    if (inviter.role === 'LETTING_AGENT' && role !== $Enums.UserRole.TENANT) {
      throw new ForbiddenException('Letting agents can only invite tenants');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId: dto.tenantId, email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists in this workspace');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    // Re-inviting the same email refreshes the pending invitation.
    let pending;
    try {
      pending = await this.prisma.invitation.findFirst({
        where: { tenantId: dto.tenantId, email: dto.email, status: $Enums.InviteStatus.PENDING },
      });
    } catch (err) {
      this.rethrowInvitationDbError(err);
    }

    let invitation;
    try {
      invitation = pending
        ? await this.prisma.invitation.update({
            where: { id: pending.id },
            data: { token, expiresAt, role, name: dto.name ?? pending.name, invitedById: inviter.id },
          })
        : await this.prisma.invitation.create({
            data: {
              tenantId: dto.tenantId,
              email: dto.email,
              name: dto.name,
              role,
              token,
              expiresAt,
              invitedById: inviter.id,
            },
          });
    } catch (err) {
      this.logger.error(`Failed to create invitation for ${dto.email}`, err);
      this.rethrowInvitationDbError(err);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    const inviterUser = await this.prisma.user.findUnique({
      where: { id: inviter.id },
      select: { name: true },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
    const inviteLink = frontendUrl
      ? `${base}/t/${encodeURIComponent(dto.tenantId)}/accept-invite?token=${token}`
      : `token:${token}`;

    let emailSent = false;
    try {
      const result = await this.email.sendInvitationEmail({
        to: dto.email,
        inviteLink,
        workspaceName: tenant?.name ?? dto.tenantId,
        role: dto.role,
        inviterName: inviterUser?.name,
      });
      emailSent = result.sent;
    } catch (err) {
      this.logger.error(`Invite email failed for ${dto.email}`, err);
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`Invite issued for ${dto.email} (${dto.tenantId}): ${token}`);
    }

    const baseMessage = pending ? 'Invitation refreshed' : 'Invitation created';
    return {
      message: emailSent ? `${baseMessage} and email sent` : baseMessage,
      emailSent,
      inviteLink,
      invitation: this.sanitize(invitation),
    };
  }

  async listInvites(tenantId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { tenantId, invitations: invitations.map((i) => this.sanitize(i)) };
  }

  async revokeInvite(tenantId: string, id: string) {
    const invitation = await this.prisma.invitation.findFirst({ where: { id, tenantId } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== $Enums.InviteStatus.PENDING) {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: { status: $Enums.InviteStatus.REVOKED },
    });

    return { message: 'Invitation revoked', invitation: this.sanitize(updated) };
  }

  /** Public: lets the accept page show who the invite is for before sign-up. */
  async previewInvite(token: string) {
    const invitation = await this.findValidPendingInvite(token);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: invitation.tenantId } });

    return {
      tenantId: invitation.tenantId,
      workspaceName: tenant?.name ?? invitation.tenantId,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role.toLowerCase(),
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /** Public: the invitee sets their name/password and becomes a workspace user. */
  async acceptInvite(dto: AcceptInviteDto) {
    const invitation = await this.findValidPendingInvite(dto.token);

    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId: invitation.tenantId, email: invitation.email },
    });
    if (existingUser) {
      throw new BadRequestException('An account already exists for this email. Sign in instead.');
    }

    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        name: dto.name,
        email: invitation.email,
        password: hashedPassword,
        // The invite arrived via this email address, so it is verified by definition.
        emailVerified: true,
        role: invitation.role,
        phone: dto.phone,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: $Enums.InviteStatus.ACCEPTED, acceptedAt: new Date() },
    });

    await this.email.sendWelcomeEmail({ to: user.email });

    return {
      message: 'Invitation accepted. You can now sign in.',
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  private async findValidPendingInvite(token: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (
      !invitation ||
      invitation.status !== $Enums.InviteStatus.PENDING ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException('This invitation is invalid, expired or has been revoked');
    }
    return invitation;
  }

  private rethrowInvitationDbError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      throw new InternalServerErrorException(
        'Invitations are not set up in the database yet. Run: npx prisma migrate deploy',
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    if (/invitation/i.test(message) && /does not exist|undefined_table|relation .* does not exist/i.test(message)) {
      throw new InternalServerErrorException(
        'Invitations are not set up in the database yet. Run: npx prisma migrate deploy',
      );
    }

    throw err;
  }

  private sanitize(invitation: any) {
    const { token: _token, ...rest } = invitation;
    return { ...rest, role: rest.role.toLowerCase(), status: rest.status.toLowerCase() };
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
