-- Operating profiles: a user may hold multiple roles (e.g. landlord + tenant) in one workspace.
-- User.role remains the active operating profile; UserRoleGrant stores all granted profiles.

CREATE TABLE "UserRoleGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRoleGrant_userId_role_key" ON "UserRoleGrant"("userId", "role");
CREATE INDEX "UserRoleGrant_userId_idx" ON "UserRoleGrant"("userId");

ALTER TABLE "UserRoleGrant" ADD CONSTRAINT "UserRoleGrant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one grant per user from their current active role.
INSERT INTO "UserRoleGrant" ("id", "userId", "role")
SELECT
    'grant_' || "id" || '_' || LOWER("role"::text),
    "id",
    "role"
FROM "User"
ON CONFLICT DO NOTHING;
