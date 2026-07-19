import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  LETTING_AGENT = 'letting_agent',
  ADMIN = 'admin',
}

export enum TenancyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  LATE = 'late',
  MISSED = 'missed',
}

export class TenantScopedDto {
  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  tenantId: string;
}

export class CreateUserDto extends TenantScopedDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: '+441234567890' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123resettoken' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'verification_token_here' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class CreatePropertyDto extends TenantScopedDto {
  @ApiProperty({ example: '2-bed flat in Camden' })
  @IsString()
  title: string;

  @ApiProperty({ example: '12 High Street, London NW1 1AA' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'clx123landlordid' })
  @IsString()
  landlordId: string;

  @ApiPropertyOptional({ example: 'clx123agentid' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  bedrooms: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  rentAmount: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateTenancyDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123propertyid' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'clx123tenantuserid' })
  @IsString()
  tenantUserId: string;

  @ApiProperty({ example: 'clx123landlordid' })
  @IsString()
  landlordId: string;

  @ApiPropertyOptional({ example: 'clx123agentid' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  rentAmount: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TenancyStatus, example: TenancyStatus.PENDING })
  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;
}

export class InitiatePaymentDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123tenancyid' })
  @IsString()
  tenancyId: string;

  @ApiProperty({ example: 'clx123payerid' })
  @IsString()
  payerId: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'stripe' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'pay_ref_123' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class CreatePaymentScheduleDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123tenancyid' })
  @IsString()
  tenancyId: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  frequency: string;

  @ApiProperty({ example: '2026-02-01' })
  @IsString()
  nextDueDate: string;
}

export class VerifyPaymentDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123paymentid' })
  @IsString()
  paymentId: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  verifiedAmount?: number;
}
