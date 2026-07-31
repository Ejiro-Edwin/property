"use client";

import * as React from "react";
import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AppNav } from "@/components/app/nav";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

function canSeeAudit(role: string | undefined) {
  const r = (role ?? "").toLowerCase();
  return r === "admin";
}

export function AppShell({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [role, setRole] = React.useState<string | undefined>();

  React.useEffect(() => {
    api<{ user: { role?: string } }>("auth/me", { tenantId })
      .then((r) => setRole(r.user?.role))
      .catch(() => setRole(undefined));
  }, [tenantId]);

  const logoutAction = `/api/auth/logout?redirect=${encodeURIComponent(`/t/${tenantId}/login`)}`;

  const sidebar = (
    <>
      <Link
        href={`/t/${tenantId}/app`}
        className="flex items-center gap-3 px-1"
        onClick={() => setMobileOpen(false)}
      >
        <Mark />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">TenantSea</div>
          <div className="text-xs text-muted">{tenantId}</div>
        </div>
      </Link>

      <AppNav tenantId={tenantId} showAudit={canSeeAudit(role)} />

      <div className="mt-auto px-1">
        <form action={logoutAction} method="post">
          <button
            type="submit"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href={`/t/${tenantId}/app`} className="flex items-center gap-2">
          <Mark />
          <span className="text-sm font-semibold tracking-tight">TenantSea</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col gap-7 border-r border-border bg-background px-4 py-6 transition-transform md:static md:sticky md:top-0 md:z-auto md:h-dvh md:translate-x-0",
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
