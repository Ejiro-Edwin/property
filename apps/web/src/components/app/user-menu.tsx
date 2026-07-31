"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  tenantId: string;
  user: {
    name: string;
    email: string;
    role?: string;
  } | null;
  onNavigate?: () => void;
};

export function UserMenu({ tenantId, user, onNavigate }: UserMenuProps) {
  const logoutAction = `/api/auth/logout?redirect=${encodeURIComponent("/login")}`;
  const profileHref = `/t/${tenantId}/app/profile`;

  return (
    <div className="border-t border-border pt-4">
      {user ? (
        <Link
          href={profileHref}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-black/5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
        </Link>
      ) : (
        <div className="px-2 py-2 text-sm text-muted">Loading account…</div>
      )}

      <div className="mt-2 grid gap-1 px-1">
        <Link
          href={profileHref}
          onClick={onNavigate}
          className="rounded-[10px] px-2 py-2 text-sm text-muted transition-colors hover:bg-black/5 hover:text-foreground"
        >
          Profile
        </Link>
        <form action={logoutAction} method="post">
          <Button
            type="submit"
            variant="secondary"
            className="w-full justify-start"
          >
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
