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
  @IsString()
  tenantId: string;
}

export class CreateUserDto extends TenantScopedDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  tenantId: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class CreatePropertyDto extends TenantScopedDto {
  @IsString()
  title: string;

  @IsString()
  address: string;

  @IsString()
  landlordId: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsNumber()
  bedrooms: number;

  @IsNumber()
  rentAmount: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateTenancyDto extends TenantScopedDto {
  @IsString()
  propertyId: string;

  @IsString()
  tenantUserId: string;

  @IsString()
  landlordId: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsNumber()
  rentAmount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;
}

export class InitiatePaymentDto extends TenantScopedDto {
  @IsString()
  tenancyId: string;

  @IsString()
  payerId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class CreatePaymentScheduleDto extends TenantScopedDto {
  @IsString()
  tenancyId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  frequency: string;

  @IsString()
  nextDueDate: string;
}

export class VerifyPaymentDto extends TenantScopedDto {
  @IsString()
  paymentId: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsNumber()
  verifiedAmount?: number;
}
