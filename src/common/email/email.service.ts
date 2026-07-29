import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

type EmailSendParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private isEnabled() {
    return process.env.EMAIL_ENABLED === 'true';
  }

  private getFrom() {
    return process.env.SMTP_FROM || 'no-reply@tenantsea.local';
  }

  private getTransport() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMail(params: EmailSendParams) {
    if (!this.isEnabled()) {
      this.logger.log(`[EMAIL_DISABLED] to=${params.to} subject=${params.subject} text=${params.text}`);
      return { queued: false, sent: false };
    }

    const transport = this.getTransport();
    if (!transport) {
      this.logger.warn(
        `[EMAIL_ENABLED_NO_SMTP] to=${params.to} subject=${params.subject} (set SMTP_HOST/SMTP_PORT)`,
      );
      return { queued: false, sent: false };
    }

    await transport.sendMail({
      from: this.getFrom(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    return { queued: false, sent: true };
  }

  async sendPasswordResetEmail(params: { to: string; resetLink: string; tenantId?: string }) {
    const subject = 'Reset your TenantSea password';
    const text = [
      'A password reset was requested for your TenantSea account.',
      '',
      `Reset link: ${params.resetLink}`,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    return this.sendMail({ to: params.to, subject, text });
  }

  async sendEmailVerificationEmail(params: { to: string; verifyLink: string }) {
    const subject = 'Verify your TenantSea email';
    const text = [
      'Welcome to TenantSea.',
      '',
      `Verify your email: ${params.verifyLink}`,
      '',
      'If you did not create an account, you can ignore this email.',
    ].join('\n');

    return this.sendMail({ to: params.to, subject, text });
  }

  async sendInvitationEmail(params: {
    to: string;
    inviteLink: string;
    workspaceName: string;
    role: string;
    inviterName?: string;
  }) {
    const subject = `You've been invited to ${params.workspaceName} on TenantSea`;
    const who = params.inviterName ? `${params.inviterName} has` : 'You have been';
    const text = [
      `${who} invited you to join the "${params.workspaceName}" workspace on TenantSea as ${params.role.replace('_', ' ')}.`,
      '',
      `Accept the invitation and set up your account: ${params.inviteLink}`,
      '',
      'This invitation expires in 7 days. If you were not expecting it, you can ignore this email.',
    ].join('\n');

    return this.sendMail({ to: params.to, subject, text });
  }

  async sendWelcomeEmail(params: { to: string }) {
    const subject = 'Welcome to TenantSea';
    const text = ['Your TenantSea account is ready.', '', 'You can now sign in and start using the platform.'].join(
      '\n',
    );
    return this.sendMail({ to: params.to, subject, text });
  }
}

