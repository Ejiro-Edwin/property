-- Add email verification fields to User
ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

-- Index token lookup
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

