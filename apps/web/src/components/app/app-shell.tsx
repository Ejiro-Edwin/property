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
        className="flex shrink-0 items-center gap-3 px-1"
        onClick={closeMobile}
      >
        <Mark />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">TenantSea</div>
          <div className="text-xs text-muted">{tenantId}</div>
        </div>
      </Link>

      <ProfileSwitcher
        tenantId={tenantId}
        activeRole={activeRole}
        profiles={profiles}
        onSwitched={() => loadSession()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppNav tenantId={tenantId} role={activeRole} showAudit={canSeeAudit(activeRole)} />
      </div>

      <UserMenu tenantId={tenantId} user={user} onNavigate={closeMobile} />
    </>
  );

  return (
    <div className="app-workspace min-h-dvh flex flex-col md:flex-row">
      <header className="app-sidebar flex items-center justify-between border-b border-white/10 px-4 py-3 text-white md:hidden">
        <Link href={`/t/${tenantId}/app`} className="flex items-center gap-2">
          <Mark className="h-7 w-7 text-[#e6ffb3]" />
          <span className="text-sm font-semibold tracking-tight">TenantSea</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/t/${tenantId}/app/profile`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#203d39] text-sm font-semibold text-[#efffee]"
          >
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
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
          "app-sidebar fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col gap-5 border-r border-white/10 px-4 py-6 text-white transition-transform md:static md:sticky md:top-0 md:z-auto md:h-dvh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </aside>

      <div className="page-shell min-w-0 flex-1 rounded-t-[24px] md:rounded-l-[24px] md:rounded-tr-[0] md:mt-4 md:mr-4 md:mb-4">
        <main className="px-4 py-6 md:px-7 md:py-8">{children}</main>
      </div>
    </div>
  );
}
