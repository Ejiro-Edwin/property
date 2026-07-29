"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, paymentStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  IconBell,
  IconBuilding,
  IconCard,
  IconHome,
  IconShield,
  IconUsers,
} from "@/components/ui/icons";

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

function DashboardTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft text-brand-ink">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        {detail ? <div className="mt-1 text-xs text-muted">{detail}</div> : null}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [properties, setProperties] = React.useState<Property[] | null>(null);
  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[] | null>(null);
  const totalPayments = dashboard?.paymentSummary.totalPayments ?? 0;
  const onTime = dashboard?.paymentSummary.onTime ?? 0;
  const late = dashboard?.paymentSummary.late ?? 0;
  const missed = dashboard?.paymentSummary.missed ?? 0;
  const collectionRate = totalPayments > 0 ? Math.round((onTime / totalPayments) * 100) : 0;
  const propertyCount = properties?.length ?? 0;
  const notificationCount = notifications?.length ?? 0;

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
    <div className="mx-auto grid w-full max-w-6xl gap-8 pb-8">
      <section className="card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8">
            <Badge tone="brand" className="w-fit">
              Workspace {tenantId}
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your portfolio, at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Keep properties, people, rent and trust in one calm workspace.
              Track what is due, what has been paid and what needs attention next.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/t/${tenantId}/app/properties`}>
                <Button>
                  <IconBuilding width={16} height={16} />
                  Add property
                </Button>
              </Link>
              <Link href={`/t/${tenantId}/app/people`}>
                <Button variant="secondary">
                  <IconUsers width={16} height={16} />
                  Invite people
                </Button>
              </Link>
              <Link href={`/t/${tenantId}/app/payments`}>
                <Button variant="secondary">
                  <IconCard width={16} height={16} />
                  Review payments
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] bg-brand-soft/70 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Properties
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {propertyCount}
                </div>
              </div>
              <div className="rounded-[16px] bg-brand-soft/70 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Active tenancies
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {dashboard ? dashboard.activeTenancies : "…"}
                </div>
              </div>
              <div className="rounded-[16px] bg-brand-soft/70 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Collection rate
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {totalPayments > 0 ? `${collectionRate}%` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[320px] bg-gradient-to-br from-brand-soft/80 via-surface to-sand/70 p-6 sm:p-8">
            <div className="property-art absolute inset-5 rounded-[22px]" />
            <div className="relative ml-auto flex h-full max-w-sm flex-col justify-end gap-4">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted">
                      Next action
                    </div>
                    <div className="mt-1 text-sm font-semibold tracking-tight">
                      {propertyCount === 0 ? "Add your first property" : "Invite a tenant"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand-ink">
                    <IconHome width={18} height={18} />
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-muted">
                  {propertyCount === 0
                    ? "Create a property to start tracking occupancy, tenancies and rent."
                    : "Bring the right people into the workspace so the portfolio can move."}
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted">
                    Alerts
                  </div>
                  <IconBell width={16} height={16} />
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Late or missed payments</span>
                    <Badge tone={late + missed > 0 ? "warning" : "success"}>
                      {late + missed > 0 ? `${late + missed}` : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Unread notifications</span>
                    <Badge tone={notificationCount > 0 ? "brand" : "neutral"}>
                      {notificationCount}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard ? (
          <>
            <DashboardTile
              icon={<IconHome width={18} height={18} />}
              label="Active tenancies"
              value={dashboard.activeTenancies}
              detail="Tenancy relationships currently live"
            />
            <DashboardTile
              icon={<IconBuilding width={18} height={18} />}
              label="Properties"
              value={propertyCount}
              detail="Ready to rent or already occupied"
            />
            <DashboardTile
              icon={<IconCard width={18} height={18} />}
              label="Payments recorded"
              value={dashboard.paymentSummary.totalPayments}
              detail={totalPayments > 0 ? `${collectionRate}% on time` : "No payments yet"}
            />
            <DashboardTile
              icon={<IconShield width={18} height={18} />}
              label="Attention needed"
              value={late + missed}
              detail={late + missed > 0 ? "Late or missed payments flagged" : "Nothing urgent right now"}
            />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px]" />)
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_0.95fr]">
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
              <Skeleton className="h-[172px]" />
            ) : properties.length === 0 ? (
              <div className="card p-6">
                <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold tracking-tight">
                      No properties yet
                    </div>
                    <div className="mt-2 text-sm leading-6 text-muted">
                      Start with your first building or flat so the workspace has
                      something real to manage.
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/t/${tenantId}/app/properties`}>
                        <Button size="sm">Add property</Button>
                      </Link>
                      <Link href={`/t/${tenantId}/app/people`}>
                        <Button size="sm" variant="secondary">
                          Invite people
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="property-art h-[160px] rounded-[18px]" />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {properties.map((p) => (
                  <div key={p.id} className="card overflow-hidden">
                    <div className="property-art h-24" />
                    <div className="p-4">
                      <div className="truncate text-sm font-semibold tracking-tight">
                        {p.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted">{p.address}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {formatMoney(p.rentAmount, p.currency)}
                          <span className="text-xs font-normal text-muted"> / yr</span>
                        </div>
                        <Badge tone="brand">Live</Badge>
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
              <Skeleton className="h-[208px]" />
            ) : payments.length === 0 ? (
              <div className="card p-6">
                <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold tracking-tight">
                      No payments recorded yet
                    </div>
                    <div className="mt-2 text-sm leading-6 text-muted">
                      Payments, schedules and verification records will appear here
                      once you start managing tenancies.
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-muted">
                      <div>• Create a tenancy and payment schedule</div>
                      <div>• Record or verify a payment</div>
                      <div>• Track who paid, who is late, and what is due next</div>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-border bg-brand-soft/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted">
                      Collection snapshot
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">0%</div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/6">
                      <div className="h-full w-[12%] rounded-full bg-brand" />
                    </div>
                    <div className="mt-3 text-xs text-muted">
                      Your payment summary will animate here when the first rent is logged.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card divide-y divide-border">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4">
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
            <Skeleton className="h-[320px]" />
          ) : notifications.length === 0 ? (
            <div className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand-soft text-brand-ink">
                <IconBell width={18} height={18} />
              </div>
              <div className="mt-4 text-sm font-semibold tracking-tight">
                You&apos;re all caught up
              </div>
              <div className="mt-2 text-sm leading-6 text-muted">
                Alerts, overdue notices and payment updates will appear here as
                soon as the workspace starts moving.
              </div>
              <div className="mt-5 grid gap-2 text-xs text-muted">
                <div>• Overdue rent reminders</div>
                <div>• Payment verification updates</div>
                <div>• Invite acceptance and onboarding events</div>
              </div>
            </div>
          ) : (
            <div className="card divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 px-4 py-4">
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
