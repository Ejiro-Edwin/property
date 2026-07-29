"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, paymentStatusTone } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";

type Dashboard = {
  activeTenancies: number;
  paymentSummary: { totalPayments: number; onTime: number; late: number; missed: number };
  notifications: string[];
};

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function OverviewPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [properties, setProperties] = React.useState<Property[] | null>(null);
  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[] | null>(null);

  React.useEffect(() => {
    // Each section loads independently and degrades gracefully
    // (e.g. tenant-role users can't access the landlord dashboard).
    api<Dashboard>("trust/dashboard", { tenantId })
      .then(setDashboard)
      .catch(() => setDashboard(null));

    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 3 } })
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]));

    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 5 } })
      .then((r) => setPayments(r.payments ?? []))
      .catch(() => setPayments([]));

    api<{ notifications: Notification[] }>("notifications", { tenantId, query: { limit: 5 } })
      .then((r) => setNotifications(r.notifications ?? []))
      .catch(() => setNotifications([]));
  }, [tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          What&apos;s happening across your portfolio today.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboard ? (
          <>
            <StatCard label="Active tenancies" value={dashboard.activeTenancies} />
            <StatCard label="Payments recorded" value={dashboard.paymentSummary.totalPayments} />
            <StatCard
              label="Paid on time"
              value={dashboard.paymentSummary.onTime}
              hint={dashboard.notifications?.[0]}
            />
            <StatCard
              label="Late / missed"
              value={dashboard.paymentSummary.late + dashboard.paymentSummary.missed}
              hint={dashboard.notifications?.[1]}
            />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px]" />)
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Properties + recent payments */}
        <div className="grid gap-6">
          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Properties</h2>
              <Link
                href={`/t/${tenantId}/app/properties`}
                className="text-sm text-muted hover:text-foreground"
              >
                View all
              </Link>
            </div>
            {properties === null ? (
              <Skeleton className="h-[132px]" />
            ) : properties.length === 0 ? (
              <div className="card-flat px-5 py-8 text-center text-sm text-muted">
                No properties yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {properties.map((p) => (
                  <div key={p.id} className="card-flat overflow-hidden">
                    <div className="property-art h-20" />
                    <div className="p-4">
                      <div className="truncate text-sm font-semibold tracking-tight">
                        {p.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted">{p.address}</div>
                      <div className="mt-2 text-sm font-medium">
                        {formatMoney(p.rentAmount, p.currency)}
                        <span className="text-xs font-normal text-muted"> / yr</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Recent payments</h2>
              <Link
                href={`/t/${tenantId}/app/payments`}
                className="text-sm text-muted hover:text-foreground"
              >
                View all
              </Link>
            </div>
            {payments === null ? (
              <Skeleton className="h-[160px]" />
            ) : payments.length === 0 ? (
              <div className="card-flat px-5 py-8 text-center text-sm text-muted">
                No payments recorded yet.
              </div>
            ) : (
              <div className="card-flat divide-y divide-border">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {formatMoney(p.amount, p.currency)}
                      </div>
                      <div className="text-xs text-muted">{formatDateTime(p.createdAt)}</div>
                    </div>
                    <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Notifications */}
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
            <Link
              href={`/t/${tenantId}/app/notifications`}
              className="text-sm text-muted hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {notifications === null ? (
            <Skeleton className="h-[220px]" />
          ) : notifications.length === 0 ? (
            <div className="card-flat px-5 py-8 text-center text-sm text-muted">
              You&apos;re all caught up.
            </div>
          ) : (
            <div className="card-flat divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={
                      n.read
                        ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border"
                        : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                    }
                  />
                  <div className="min-w-0">
                    <div className="text-sm leading-5">{n.message}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {formatDateTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
