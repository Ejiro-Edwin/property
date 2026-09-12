"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [items, setItems] = React.useState<Notification[] | null>(null);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const unreadCount = items?.filter((n) => !n.read).length ?? 0;
  const readCount = items?.filter((n) => n.read).length ?? 0;
  const totalCount = items?.length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    setItems(null);
    api<{ notifications: Notification[] }>("notifications", {
      tenantId,
      query: { limit: 50, ...(filter === "unread" ? { read: false } : {}) },
    })
      .then((r) => {
        if (!cancelled) setItems(r.notifications ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, filter]);

  async function markRead(id: string) {
    setItems((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev,
    );
    try {
      await api(`notifications/${id}/read`, {
        method: "POST",
        tenantId,
        body: { read: true },
      });
    } catch {
      // revert on failure
      setItems((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, read: false } : n)) : prev,
      );
    }
  }

  async function markAllRead() {
    try {
      await api("notifications/read-all", {
        method: "POST",
        tenantId,
        body: { tenantId },
      });
      setItems((prev) => prev ? prev.map((n) => ({ ...n, read: true })) : prev);
    } catch {
      // no-op; page still works if bulk action fails
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <PageHeader
        title="Notifications"
        description="Overdue rent alerts, payment updates and workspace activity."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[12px] border border-slate-200 bg-white p-0.5 shadow-sm">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-sm capitalize transition-colors",
                    filter === f
                      ? "bg-[#efffee] font-medium text-[#004b49]"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">
            {items === null ? "…" : totalCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Workspace notifications</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Unread</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">
            {items === null ? "…" : unreadCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Needs your attention</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Read</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">
            {items === null ? "…" : readCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Already acknowledged</div>
        </div>
      </div>

      {items === null ? (
        <Skeleton className="h-[280px]" />
      ) : items.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "Nothing unread" : "No notifications"}
          body="You're all caught up. Overdue payments and workspace events will show up here."
        />
      ) : (
        <div className="card-flat divide-y divide-border">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-5 py-4">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.read ? "bg-border" : "bg-brand",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-6">{n.message}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="capitalize">{n.type.replaceAll("_", " ")}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDateTime(n.createdAt)}</span>
                </div>
              </div>
              {!n.read ? (
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 text-xs font-medium text-brand hover:underline"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
