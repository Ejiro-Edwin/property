"use client";

import * as React from "react";
import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AppNav } from "@/components/app/nav";
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

  React.useEffect(() => {
    api<{ user: CurrentUser }>("auth/me", { tenantId })
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, [tenantId]);

  const closeMobile = () => setMobileOpen(false);

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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppNav tenantId={tenantId} role={user?.role} showAudit={canSeeAudit(user?.role)} />
      </div>

      <UserMenu tenantId={tenantId} user={user} onNavigate={closeMobile} />
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href={`/t/${tenantId}/app`} className="flex items-center gap-2">
          <Mark />
          <span className="text-sm font-semibold tracking-tight">TenantSea</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/t/${tenantId}/app/profile`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink"
          >
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-foreground"
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
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col gap-5 border-r border-border bg-background px-4 py-6 transition-transform md:static md:sticky md:top-0 md:z-auto md:h-dvh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </aside>

      <div className="min-w-0 flex-1">
        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
