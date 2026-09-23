import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Matches, MinLength } from 'class-validator';

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

export class UpdateUserDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123userid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+441234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TENANT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'acme-corp',
    description:
      'Optional workspace handle. If omitted, one is generated automatically from your company name or email.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9](?:[a-z0-9-]{1,38})?[a-z0-9]$/, {
    message: 'tenantId must be 2-40 chars of lowercase letters, numbers and hyphens',
  })
  tenantId?: string;

  @ApiPropertyOptional({ example: 'Acme Properties Ltd' })
  @IsOptional()
  @IsString()
  workspaceName?: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+441234567890' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateInviteDto extends TenantScopedDto {
  @ApiProperty({ example: 'tenant@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Tenant' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT })
  @IsEnum(UserRole)
  role: UserRole;
}

export class AcceptInviteDto {
  @ApiProperty({ example: 'invite_token_here' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'John Tenant' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

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

/** Switch the active operating profile (landlord mode vs tenant mode, etc.). */
export class SwitchProfileDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.TENANT,
    description: 'Operating profile to activate for this session',
  })
  @IsEnum(UserRole)
  role: UserRole;
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

  @ApiPropertyOptional({ type: [String], example: ['Parking Space', 'Water Supply'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

export class UpdatePropertyDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123propertyid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: '2-bed flat in Camden' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '12 High Street, London NW1 1AA' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'clx123landlordid' })
  @IsOptional()
  @IsString()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'clx123agentid' })
  @IsOptional()
  @IsString()
  agentId?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  rentAmount?: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreatePropertyAmenityDto extends TenantScopedDto {
  @ApiProperty({ example: 'Parking space' })
  @IsString()
  name: string;
}

export class CreatePropertyRuleDto extends TenantScopedDto {
  @ApiProperty({ example: 'No smoking' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Smoking is not permitted inside the property.' })
  @IsOptional()
  @IsString()
  details?: string;
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

export class UpdateTenancyDto extends TenantScopedDto {
  @ApiProperty({ example: 'clx123tenancyid' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'clx123propertyid' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'clx123tenantuserid' })
  @IsOptional()
  @IsString()
  tenantUserId?: string;

  @ApiPropertyOptional({ example: 'clx123landlordid' })
  @IsOptional()
  @IsString()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'clx123agentid' })
  @IsOptional()
  @IsString()
  agentId?: string | null;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  rentAmount?: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string | null;

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
