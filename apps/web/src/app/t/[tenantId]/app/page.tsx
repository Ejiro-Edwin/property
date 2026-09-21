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

type Dashboard = { activeTenancies: number; totalProperties?: number; occupiedProperties?: number; vacantProperties?: number; paymentSummary: { totalPayments: number; onTime: number; late: number; missed: number; collectedAmount?: number; expectedAmount?: number; collectionRate?: number }; notifications: string[] };
type Property = { id: string; title: string; address: string; bedrooms: number | null; rentAmount: number; currency: string };
type Payment = { id: string; amount: number; currency: string; status: string; createdAt: string };
type Notification = { id: string; message: string; type: string; read: boolean; createdAt: string };
type SessionUser = { role?: string; name?: string };

export default function OverviewPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [sessionUser, setSessionUser] = React.useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [properties, setProperties] = React.useState<Property[] | null>(null);
  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[] | null>(null);

  React.useEffect(() => { api<{ user: SessionUser }>("auth/me", { tenantId }).then((r) => setSessionUser(r.user)).catch(() => setSessionUser(null)); }, [tenantId]);
  React.useEffect(() => {
    if (sessionUser === null || isTenantRole(sessionUser.role)) return;
    api<Dashboard>("trust/dashboard", { tenantId }).then(setDashboard).catch(() => setDashboard(null));
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 6 } }).then((r) => setProperties(r.properties ?? [])).catch(() => setProperties([]));
    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 6 } }).then((r) => setPayments(r.payments ?? [])).catch(() => setPayments([]));
    api<{ notifications: Notification[] }>("notifications", { tenantId, query: { limit: 6 } }).then((r) => setNotifications(r.notifications ?? [])).catch(() => setNotifications([]));
  }, [tenantId, sessionUser]);

  if (sessionUser === null) return <Skeleton className="mx-auto h-[420px] max-w-6xl" />;
  if (isTenantRole(sessionUser.role)) return <TenantHome />;

  const totalPayments = dashboard?.paymentSummary.totalPayments ?? 0;
  const onTime = dashboard?.paymentSummary.onTime ?? 0;
  const attention = (dashboard?.paymentSummary.late ?? 0) + (dashboard?.paymentSummary.missed ?? 0);
  const collectionRate = dashboard?.paymentSummary.collectionRate ?? (totalPayments ? Math.round((onTime / totalPayments) * 100) : 0);

  const vacantProperties = Math.max((properties?.length ?? 0) - (dashboard?.activeTenancies ?? 0), 0);
  const portfolioRent = dashboard?.paymentSummary.collectedAmount ?? 0;

  return (
    <div className="mx-auto grid w-full max-w-[1295px] gap-5 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.045em] text-[#24211f]">Good morning, {sessionUser.name?.split(" ")[0] ?? "landlord"}.</h1>
          <p className="mt-1 text-base text-[#77716d]">Here&apos;s what&apos;s happening across your portfolio today.</p>
        </div>
        <Link href={`/t/${tenantId}/app/properties/add`}><Button className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">Add Property</Button></Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total properties" value={properties === null ? "…" : dashboard?.totalProperties ?? properties.length} detail="Properties in your portfolio" icon={<IconBuilding width={18} height={18} />} />
        <Metric label="Occupied properties" value={dashboard?.occupiedProperties ?? dashboard?.activeTenancies ?? "…"} detail="Currently occupied" icon={<IconHome width={18} height={18} />} />
        <Metric label="Vacant properties" value={properties === null ? "…" : dashboard?.vacantProperties ?? vacantProperties} detail="Available for letting" icon={<IconBuilding width={18} height={18} />} />
        <Metric label="Total rent collected" value={dashboard === null ? "…" : formatMoney(portfolioRent)} detail={`${collectionRate}% collected this cycle`} icon={<IconCard width={18} height={18} />} />
      </div>

      <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-[#24211f]">Rent Collection</h2><p className="mt-1 text-xs text-[#77716d]">Overview of rent collection this cycle</p></div><Link href={`/t/${tenantId}/app/payments`} className="text-xs font-semibold text-[#45863b]">View payments</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-4"><div><div className="text-[11px] text-[#77716d]">Collected</div><div className="mt-1 font-bold text-[#45863b]">{formatMoney(portfolioRent)}</div></div><div><div className="text-[11px] text-[#77716d]">Pending</div><div className="mt-1 font-bold text-[#d08a28]">{formatMoney(0)}</div></div><div><div className="text-[11px] text-[#77716d]">Overdue</div><div className="mt-1 font-bold text-[#d95c4e]">{formatMoney(0)}</div></div><div className="sm:col-span-1"><div className="h-2 rounded-full bg-[#e8f0e3]"><div className="h-2 rounded-full bg-[#baff00]" style={{ width: `${collectionRate}%` }} /></div><div className="mt-2 text-right text-[10px] text-[#77716d]">{collectionRate}%</div></div></div></section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]"><section><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#24211f]">Outstanding Payments</h2><Link href={`/t/${tenantId}/app/payments`} className="text-xs font-semibold text-[#45863b]">View all</Link></div><div className="rounded-[8px] border border-[#dfe7e3] bg-white p-4">{payments === null ? <Skeleton className="h-16" /> : payments.length === 0 ? <div className="py-4 text-center text-sm text-[#77716d]">No outstanding payments</div> : payments.slice(0, 3).map((payment) => <div key={payment.id} className="flex items-center justify-between border-b border-[#edf0ed] py-3 last:border-0"><div><div className="text-sm font-semibold text-[#24211f]">Payment recorded</div><div className="text-xs text-[#77716d]">{formatDateTime(payment.createdAt)}</div></div><Badge tone={paymentStatusTone(payment.status)}>{payment.status}</Badge></div>)}</div></section><section><div className="mb-2 text-sm font-semibold text-[#24211f]">Quick Actions</div><div className="grid grid-cols-2 gap-2"><QuickAction href={`/t/${tenantId}/app/properties/add`} label="Add Property" /><QuickAction href={`/t/${tenantId}/app/people/add`} label="Add Tenant" /><QuickAction href={`/t/${tenantId}/app/tenancies/create`} label="Create Tenancy" /><QuickAction href={`/t/${tenantId}/app/payments/record`} label="Record Payment" /></div></section></div>

      <section><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#24211f]">Your Properties</h2><Link href={`/t/${tenantId}/app/properties`} className="text-xs font-semibold text-[#45863b]">View all properties</Link></div><div className="grid gap-4 sm:grid-cols-3">{properties === null ? <Skeleton className="h-36" /> : properties.length === 0 ? <div className="col-span-full rounded-[8px] border border-[#dfe7e3] bg-white p-8 text-center text-sm text-[#77716d]">No properties yet. Add your first property to get started.</div> : properties.slice(0, 3).map((property) => <Link key={property.id} href={`/t/${tenantId}/app/properties/${property.id}`} className="rounded-[8px] border border-[#dfe7e3] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><div className="property-art h-24 rounded-[6px]" /><div className="mt-3 text-sm font-semibold text-[#24211f]">{property.title}</div><div className="mt-1 text-xs text-[#77716d]">{property.address}</div><div className="mt-2 flex justify-between text-xs"><span>{formatMoney(property.rentAmount, property.currency)}</span><Badge tone="success">Occupied</Badge></div></Link>)}</div></section>

      <section><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#24211f]">Property Performance</h2><div className="flex gap-1 text-[10px] text-[#71817e]"><span className="rounded bg-[#f2fff0] px-2 py-1 font-semibold text-[#45863b]">This Year</span><span className="px-2 py-1">Last Year</span></div></div><div className="flex h-[150px] items-end justify-around rounded-[8px] border border-[#dfe7e3] bg-white px-8 pb-5 pt-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => <div key={month} className="flex h-full flex-col items-center justify-end gap-2"><div className="flex h-[92px] items-end gap-1"><span className="w-3 rounded-t bg-[#baff00]" style={{ height: `${28 + index * 8}px` }} /><span className="w-3 rounded-t bg-[#004b49]" style={{ height: `${42 + ((index + 2) % 4) * 12}px` }} /></div><span className="text-[10px] text-[#71817e]">{month}</span></div>)}</div></section>

      <section className="grid gap-5 lg:grid-cols-2"><div><div className="mb-2 text-sm font-semibold text-[#24211f]">Tenancy Overview</div><div className="rounded-[8px] border border-[#dfe7e3] bg-white p-4"><div className="grid grid-cols-4 gap-3 text-center text-xs"><div><div className="text-xl font-bold text-[#24211f]">{dashboard?.activeTenancies ?? 0}</div><div className="text-[#77716d]">Active</div></div><div><div className="text-xl font-bold text-[#24211f]">0</div><div className="text-[#77716d]">Pending</div></div><div><div className="text-xl font-bold text-[#24211f]">0</div><div className="text-[#77716d]">Ended</div></div><div><div className="text-xl font-bold text-[#24211f]">{properties?.length ?? 0}</div><div className="text-[#77716d]">Total</div></div></div><Link href={`/t/${tenantId}/app/tenancies`} className="mt-4 block text-center text-xs font-semibold text-[#45863b]">View tenancies</Link></div></div><div><div className="mb-2 text-sm font-semibold text-[#24211f]">Recent Activity</div><div className="rounded-[8px] border border-[#dfe7e3] bg-white p-4">{notifications?.length ? notifications.slice(0, 3).map((notice) => <div key={notice.id} className="border-b border-[#edf0ed] py-2 text-xs last:border-0"><div className="text-[#24211f]">{notice.message}</div><div className="mt-1 text-[#77716d]">{formatDateTime(notice.createdAt)}</div></div>) : <div className="py-4 text-center text-sm text-[#77716d]">No recent activity</div>}</div></div></section>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex items-center justify-between rounded-[8px] border border-[#dfe7e3] bg-white px-3 py-3 text-sm font-semibold text-[#24211f] hover:bg-[#f2fff0]"><span>{label}</span><span className="text-[#45863b]">+</span></Link>;
}

function Metric({ label, value, detail, icon, danger = false }: { label: string; value: string | number; detail: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`metric-card min-h-[148px] p-5 ${danger ? "border-[#f5b0a8]" : ""}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77716d]">{label}</div>
      <div className="mt-3 text-[28px] font-semibold tracking-[-0.055em] text-[#24211f]">{value}</div>
      <div className="mt-1 text-xs text-[#77716d]">{detail}</div>
    </div>
  );
}
