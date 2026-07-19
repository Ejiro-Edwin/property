-- Align initial migration with current schema additions.
-- Adds: User password + reset fields, Payment.dueDate, PaymentSchedule, Notification, AuditLog

-- AlterTable: User (auth/password reset support)
ALTER TABLE "User"
ADD COLUMN "password" TEXT,
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);

-- AlterTable: Payment (schedule reconciliation support)
ALTER TABLE "Payment"
ADD COLUMN "dueDate" TIMESTAMP(3);

-- CreateTable: PaymentSchedule
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "frequency" TEXT NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "statusCode" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "PaymentSchedule_tenantId_nextDueDate_idx" ON "PaymentSchedule"("tenantId", "nextDueDate");
CREATE INDEX "Notification_tenantId_userId_idx" ON "Notification"("tenantId", "userId");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");

-- Foreign keys: PaymentSchedule
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_tenancyId_fkey"
FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys: Notification
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys: AuditLog
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

