"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { TenantHome } from "@/components/app/tenant-home";
import { isTenantRole } from "@/lib/roles";
import { Badge, paymentStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";
import { IconBell, IconBuilding, IconCard, IconHome, IconUsers } from "@/components/ui/icons";

type Dashboard = { activeTenancies: number; paymentSummary: { totalPayments: number; onTime: number; late: number; missed: number }; notifications: string[] };
type Property = { id: string; title: string; address: string; bedrooms: number | null; rentAmount: number; currency: string };
type Payment = { id: string; amount: number; currency: string; status: string; createdAt: string };
type Notification = { id: string; message: string; type: string; read: boolean; createdAt: string };

export default function OverviewPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [role, setRole] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [properties, setProperties] = React.useState<Property[] | null>(null);
  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[] | null>(null);

  React.useEffect(() => { api<{ user: { role?: string } }>("auth/me", { tenantId }).then((r) => setRole(r.user?.role ?? null)).catch(() => setRole(null)); }, [tenantId]);
  React.useEffect(() => {
    if (role === null || isTenantRole(role)) return;
    api<Dashboard>("trust/dashboard", { tenantId }).then(setDashboard).catch(() => setDashboard(null));
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 6 } }).then((r) => setProperties(r.properties ?? [])).catch(() => setProperties([]));
    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 6 } }).then((r) => setPayments(r.payments ?? [])).catch(() => setPayments([]));
    api<{ notifications: Notification[] }>("notifications", { tenantId, query: { limit: 6 } }).then((r) => setNotifications(r.notifications ?? [])).catch(() => setNotifications([]));
  }, [tenantId, role]);

  if (role === null) return <Skeleton className="mx-auto h-[420px] max-w-6xl" />;
  if (isTenantRole(role)) return <TenantHome />;

  const totalPayments = dashboard?.paymentSummary.totalPayments ?? 0;
  const onTime = dashboard?.paymentSummary.onTime ?? 0;
  const attention = (dashboard?.paymentSummary.late ?? 0) + (dashboard?.paymentSummary.missed ?? 0);
  const collectionRate = totalPayments ? Math.round((onTime / totalPayments) * 100) : 0;

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-5 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-[#dfe7e3] bg-white/80 px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f6b67]">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">Good morning, landlord.</h1>
          <p className="mt-1 text-sm text-slate-600">Here&apos;s what&apos;s happening across your portfolio today.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/t/${tenantId}/app/properties`}>
            <Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">
              <IconBuilding width={16} height={16} />Add property
            </Button>
          </Link>
          <Link href={`/t/${tenantId}/app/people`}>
            <Button variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100">
              <IconUsers width={16} height={16} />Invite tenant
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Properties" value={properties === null ? "…" : properties.length} detail="In your portfolio" icon={<IconBuilding width={18} height={18} />} />
        <Metric label="Active tenancies" value={dashboard?.activeTenancies ?? "…"} detail="Currently occupied" icon={<IconHome width={18} height={18} />} />
        <Metric label="Collected this cycle" value={`${collectionRate}%`} detail={`${onTime} on-time payments`} icon={<IconCard width={18} height={18} />} />
        <Metric label="Needs attention" value={attention} detail={attention ? "Late or missed payments" : "Nothing urgent"} icon={<IconBell width={18} height={18} />} danger={attention > 0} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <section className="card overflow-hidden rounded-[22px]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#0f172a]">Properties</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest portfolio activity</p>
            </div>
            <Link href={`/t/${tenantId}/app/properties`} className="text-sm font-medium text-[#1f6b67] hover:underline">View all</Link>
          </div>
          {properties === null ? <div className="grid gap-3 p-5"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : properties.length === 0 ? <div className="p-8 text-center text-sm text-slate-600">No properties yet. Add your first property to get started.</div> : <div className="divide-y divide-slate-200">{properties.map((property) => <Link key={property.id} href={`/t/${tenantId}/app/properties`} className="grid gap-3 px-5 py-4 transition hover:bg-[#f6fff0] sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="font-medium text-[#0f172a]">{property.title}</div><div className="mt-1 text-xs text-slate-500">{property.address}</div></div><div className="text-sm font-semibold text-[#0f172a]">{formatMoney(property.rentAmount, property.currency)}<span className="ml-1 text-xs font-normal text-slate-500">/yr</span></div><Badge tone="success">Active</Badge></Link>)}</div>}
        </section>

        <section className="card overflow-hidden rounded-[22px]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#0f172a]">Notifications</h2>
              <p className="mt-1 text-xs text-slate-500">Recent workspace updates</p>
            </div>
            <Link href={`/t/${tenantId}/app/notifications`} className="text-sm font-medium text-[#1f6b67] hover:underline">View all</Link>
          </div>
          {notifications === null ? <div className="p-5"><Skeleton className="h-32" /></div> : notifications.length === 0 ? <div className="p-8 text-center text-sm text-slate-600">You&apos;re all caught up.</div> : <div className="divide-y divide-slate-200">{notifications.map((notice) => <div key={notice.id} className="flex gap-3 px-5 py-4"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notice.read ? "bg-slate-300" : "bg-[#baff00]"}`} /><div><div className="text-sm leading-5 text-slate-700">{notice.message}</div><div className="mt-1 text-xs text-slate-500">{formatDateTime(notice.createdAt)}</div></div></div>)}</div>}
        </section>
      </div>

      <section className="card overflow-hidden rounded-[22px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#0f172a]">Recent payments</h2>
            <p className="mt-1 text-xs text-slate-500">Collection activity across your tenancies</p>
          </div>
          <Link href={`/t/${tenantId}/app/payments`} className="text-sm font-medium text-[#1f6b67] hover:underline">View payments</Link>
        </div>
        {payments === null ? <div className="p-5"><Skeleton className="h-32" /></div> : payments.length === 0 ? <div className="p-8 text-center text-sm text-slate-600">No payments recorded yet.</div> : <div className="divide-y divide-slate-200">{payments.map((payment) => <div key={payment.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="text-sm font-medium text-[#0f172a]">Payment recorded</div><div className="mt-1 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</div></div><div className="text-sm font-semibold text-[#0f172a]">{formatMoney(payment.amount, payment.currency)}</div><Badge tone={paymentStatusTone(payment.status)}>{payment.status}</Badge></div>)}</div>}
      </section>
    </div>
  );
}

function Metric({ label, value, detail, icon, danger = false }: { label: string; value: string | number; detail: string; icon: React.ReactNode; danger?: boolean }) {
  return <div className="card flex items-start gap-3 p-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] ${danger ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-ink"}`}>{icon}</div><div><div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div><div className="mt-1 text-2xl font-bold tracking-tight text-teal">{value}</div><div className="mt-1 text-xs text-muted">{detail}</div></div></div>;
}
