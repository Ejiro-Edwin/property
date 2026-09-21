"use client";

import * as React from "react";
import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AppNav } from "@/components/app/nav";
import { ProfileSwitcher } from "@/components/app/profile-switcher";
import { UserMenu } from "@/components/app/user-menu";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

function canSeeAudit(role: string | undefined) {
  const r = (role ?? "").toLowerCase();
  return r === "admin";
}

type CurrentUser = {
  name: string;
  email: string;
  role?: string;
  activeRole?: string;
};

export function AppShell({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [profiles, setProfiles] = React.useState<string[]>([]);

  const loadSession = React.useCallback(() => {
    api<{ user: CurrentUser; profiles?: string[] }>("auth/me", { tenantId })
      .then((r) => {
        setUser(r.user);
        setProfiles(
          r.profiles ?? (r.user?.role ? [r.user.role] : []),
        );
      })
      .catch(() => {
        setUser(null);
        setProfiles([]);
      });
  }, [tenantId]);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const closeMobile = () => setMobileOpen(false);
  const activeRole = user?.activeRole ?? user?.role;

  const sidebar = (
    <>
      <Link
        href={`/t/${tenantId}/app`}
        className="flex shrink-0 items-center gap-3 px-2 py-2"
        onClick={closeMobile}
      >
        <Mark className="h-11 w-11" />
        <div className="leading-tight">
          <div className="text-base font-semibold tracking-tight text-[#1f1f1f]">TenantSea</div>
          <div className="text-xs text-[#77716d]">{tenantId}</div>
        </div>
      </Link>

      <ProfileSwitcher
        tenantId={tenantId}
        activeRole={activeRole}
        profiles={profiles}
        onSwitched={() => loadSession()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <AppNav tenantId={tenantId} role={activeRole} showAudit={canSeeAudit(activeRole)} />
      </div>

      <UserMenu tenantId={tenantId} user={user} onNavigate={closeMobile} />
    </>
  );

  return (
    <div className="app-workspace min-h-dvh flex flex-col md:flex-row">
      <header className="app-sidebar flex items-center justify-between border-b border-[#e7e2dd] px-4 py-3 text-[#1f1f1f] md:hidden">
        <Link href={`/t/${tenantId}/app`} className="flex items-center gap-2">
          <Mark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight">TenantSea</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/t/${tenantId}/app/profile`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f4fb] text-sm font-semibold text-[#1399d8]"
          >
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-[10px] border border-[#ded8d2] bg-white px-3 py-2 text-sm font-medium text-[#4b4744] hover:bg-[#f4f1ed]"
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col gap-5 border-r border-[#e4e2de] px-5 py-5 text-[#292624] transition-transform md:static md:sticky md:top-0 md:z-auto md:h-dvh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </aside>

      <div className="page-shell min-h-dvh min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-[#d9efd9] bg-white px-5 md:px-9">
          <div className="flex h-8 w-[220px] items-center rounded-full border border-[#dfe7e3] bg-white px-3 text-xs text-[#9a9691]">⌕&nbsp;&nbsp;Search...</div>
          <div className="flex items-center gap-4">
            <Link href={`/t/${tenantId}/app/notifications`} aria-label="Notifications" className="text-sm text-[#71817e] hover:text-[#24211f]">♧</Link>
            <Link href={`/t/${tenantId}/app/profile`} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#baff00] text-xs font-bold text-[#004b49]">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
              <span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-[#24211f]">{user?.name || "TenantSea user"}</span><span className="block text-[10px] text-[#71817e]">{activeRole?.replaceAll("_", " ") || "Workspace"}</span></span>
            </Link>
          </div>
        </header>
        <main className="px-5 py-10 md:px-9 md:py-11">{children}</main>
      </div>
    </div>
  );
}
