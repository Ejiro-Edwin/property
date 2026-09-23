"use client";

import * as React from "react";
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
  compact?: boolean;
};

export function UserMenu({ tenantId, user, onNavigate, compact = false }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const logoutAction = `/api/auth/logout?redirect=${encodeURIComponent("/")}`;
  const profileHref = `/t/${tenantId}/app/profile`;
  const settingsHref = `/t/${tenantId}/app/settings`;

  if (compact) {
    return (
      <div className="relative">
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 rounded-[10px] p-1 hover:bg-[#f4f1ed]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#baff00] text-xs font-bold text-[#004b49]">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
          <span className="hidden text-right lg:block"><span className="block text-xs font-semibold text-[#24211f]">{user?.name || "TenantSea user"}</span><span className="block text-[10px] text-[#71817e]">{user?.role?.replaceAll("_", " ") || "Workspace"}</span></span>
          <span className="px-1 text-xs text-[#71817e]">⌄</span>
        </button>
        {open ? <AccountDropdown tenantId={tenantId} profileHref={profileHref} settingsHref={settingsHref} onNavigate={() => { setOpen(false); onNavigate?.(); }} logoutAction={logoutAction} /> : null}
      </div>
    );
  }

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
        <Link href={settingsHref} onClick={onNavigate} className="rounded-[10px] px-2 py-2 text-sm text-muted transition-colors hover:bg-black/5 hover:text-foreground">Settings</Link>
        <Link href={`${settingsHref}#security`} onClick={onNavigate} className="rounded-[10px] px-2 py-2 text-sm text-muted transition-colors hover:bg-black/5 hover:text-foreground">Change password</Link>
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

function AccountDropdown({ tenantId, profileHref, settingsHref, onNavigate, logoutAction }: { tenantId: string; profileHref: string; settingsHref: string; onNavigate: () => void; logoutAction: string }) {
  return <div role="menu" className="absolute right-0 top-11 z-50 w-52 rounded-[8px] border border-[#dfe7e3] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.14)]"><Link role="menuitem" href={profileHref} onClick={onNavigate} className="block rounded-[6px] px-3 py-2 text-sm text-[#24211f] hover:bg-[#f2fff0]">Profile</Link><Link role="menuitem" href={settingsHref} onClick={onNavigate} className="block rounded-[6px] px-3 py-2 text-sm text-[#24211f] hover:bg-[#f2fff0]">Settings</Link><Link role="menuitem" href={`${settingsHref}#security`} onClick={onNavigate} className="block rounded-[6px] px-3 py-2 text-sm text-[#24211f] hover:bg-[#f2fff0]">Change password</Link><div className="my-1 border-t border-[#edf0ed]" /><form action={logoutAction} method="post"><button type="submit" className="w-full rounded-[6px] px-3 py-2 text-left text-sm text-[#b94d43] hover:bg-[#fff2f0]">Sign out</button></form></div>;
}
