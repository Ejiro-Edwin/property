"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type User = { id: string; name: string; email: string; phone?: string | null; emailVerified?: boolean };
type Tenancy = { id: string; propertyId: string; tenantUserId: string; status: string; rentAmount: number; currency: string; startDate: string; endDate: string | null; property?: { title: string; address: string } };
type Payment = { id: string; amount: number; currency: string; status: string; dueDate: string | null; createdAt: string };

export default function TenantDetailPage() {
  const { tenantId, userId } = useParams<{ tenantId: string; userId: string }>();
  const [user, setUser] = React.useState<User | null>(null);
  const [tenancy, setTenancy] = React.useState<Tenancy | null>(null);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<{ user: User }>(`users/${userId}`, { tenantId, query: { tenantId } }),
      api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 100 } }),
      api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 100 } }),
    ]).then(([userResult, tenancyResult, paymentResult]) => {
      setUser(userResult.user);
      const match = tenancyResult.tenancies?.find((item) => item.tenantUserId === userId) ?? null;
      setTenancy(match);
      setPayments(match ? (paymentResult.payments ?? []).filter((item) => item.id || match.id) : []);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Could not load tenant details"));
  }, [tenantId, userId]);

  if (error) return <div className="mx-auto max-w-[620px] py-14 text-center"><div className="text-lg font-bold text-[#004b49]">Could not load tenant</div><p className="mt-2 text-sm text-[#71817e]">{error}</p><Link href={`/t/${tenantId}/app/people`}><Button className="mt-5">Back to tenants</Button></Link></div>;
  if (!user) return <Skeleton className="mx-auto h-[480px] max-w-[1000px]" />;

  const expired = Boolean(tenancy?.endDate && new Date(tenancy.endDate).getTime() < Date.now()) || tenancy?.status.toLowerCase() === "terminated";
  const outstanding = payments.some((payment) => ["pending", "late", "missed"].includes(payment.status.toLowerCase()));
  const critical = expired && outstanding;
  const stateLabel = critical ? "Critical, lease expired & outstanding" : expired ? "Lease expired" : outstanding ? "Outstanding rent" : "Active tenancy";
  const stateTone = critical || outstanding ? "warning" : expired ? "neutral" : "success";

  return <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8"><PageHeader eyebrow="Tenant Details" title={user.name} description={`${user.email}${user.phone ? ` · ${user.phone}` : ""}`} action={<div className="flex gap-2"><Button variant="secondary">Edit Tenant</Button><Button variant="danger">Remove Tenant</Button></div>} />{critical || expired || outstanding ? <div className={`rounded-[8px] border px-4 py-3 text-sm ${critical ? "border-[#f5b0a8] bg-[#fff2f0] text-[#b94d43]" : outstanding ? "border-[#f2d397] bg-[#fff9eb] text-[#9a6816]" : "border-[#d7e1dc] bg-white text-[#71817e]"}`}>{stateLabel}. Review the details below and take action.</div> : null}<div className="flex items-center justify-between rounded-[8px] border border-[#dfe7e3] bg-white p-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#71817e]">Tenancy status</div><div className="mt-1 text-sm font-semibold text-[#24211f]">{stateLabel}</div></div><div className="flex gap-2"><Badge tone={stateTone}>{expired ? "Expired" : outstanding ? "Outstanding" : "Active"}</Badge>{(expired || outstanding) ? <Button size="sm" className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">Send reminder</Button> : null}</div></div>{tenancy ? <><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><h2 className="text-sm font-semibold text-[#24211f]">Lease Details</h2><div className="mt-4 grid gap-3 text-sm"><Detail label="Property" value={tenancy.property?.title ?? tenancy.propertyId} /><Detail label="Unit / Room" value={tenancy.property?.address ?? "Apartment"} /><Detail label="Monthly rent" value={formatMoney(tenancy.rentAmount, tenancy.currency)} /><Detail label="Lease term" value={`${formatDate(tenancy.startDate)} — ${tenancy.endDate ? formatDate(tenancy.endDate) : "Ongoing"}`} /></div></section><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><h2 className="text-sm font-semibold text-[#24211f]">Emergency Contact</h2><div className="mt-4 grid gap-3 text-sm"><Detail label="Contact name" value="Not provided" /><Detail label="Phone number" value={user.phone ?? "Not provided"} /></div></section></div><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><h2 className="text-sm font-semibold text-[#24211f]">Rent Status</h2><div className="mt-4 grid gap-3 text-sm"><Detail label="Last payment date" value={payments[0]?.createdAt ? formatDate(payments[0].createdAt) : "No payment recorded"} /><Detail label="Last amount paid" value={payments[0] ? formatMoney(payments[0].amount, payments[0].currency) : "--"} /><Detail label="Next due date" value={payments[0]?.dueDate ? formatDate(payments[0].dueDate) : "--"} /></div></section><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><h2 className="text-sm font-semibold text-[#24211f]">Recent Payments</h2><div className="mt-3 divide-y divide-[#edf0ed]">{payments.slice(0, 4).map((payment) => <div key={payment.id} className="flex items-center justify-between py-2 text-xs"><span className="text-[#71817e]">{formatDate(payment.createdAt)}</span><span className="font-semibold">{formatMoney(payment.amount, payment.currency)}</span><Badge tone={payment.status.toLowerCase() === "paid" ? "success" : "warning"}>{payment.status}</Badge></div>)}{payments.length === 0 ? <div className="py-4 text-xs text-[#71817e]">No recent payments.</div> : null}</div></section></div></> : <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-10 text-center"><div className="text-lg font-bold text-[#004b49]">No tenancy assigned</div><p className="mt-2 text-sm text-[#71817e]">Assign a property and create a tenancy for this tenant.</p><Link href={`/t/${tenantId}/app/tenancies`}><Button className="mt-5">Create tenancy</Button></Link></section>}</div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-[#edf0ed] pb-2 last:border-0"><span className="text-[#71817e]">{label}</span><span className="text-right font-semibold text-[#24211f]">{value}</span></div>; }
