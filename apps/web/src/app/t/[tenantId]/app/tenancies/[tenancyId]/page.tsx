"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Tenancy = { id: string; status: string; rentAmount: number; currency: string; startDate: string; endDate?: string | null; property: { title: string; address: string; bedrooms?: number | null; amenities?: { name: string }[]; rules?: { title: string }[] }; tenantUser?: { name: string; email: string }; landlord?: { name: string; email: string }; agent?: { name: string; email: string } | null };
type Tab = "overview" | "agreement" | "history";

export default function TenancyDetailPage() {
  const { tenantId, tenancyId } = useParams<{ tenantId: string; tenancyId: string }>();
  const [tenancy, setTenancy] = React.useState<Tenancy | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => { api<{ tenancy: Tenancy }>(`tenancies/${tenancyId}`, { tenantId }).then((result) => setTenancy(result.tenancy)).catch((err) => setError(err instanceof ApiError ? err.message : "Could not load tenancy")); }, [tenantId, tenancyId]);
  if (error) return <div className="mx-auto max-w-5xl py-12 text-center"><div className="text-lg font-semibold text-teal">Tenancy not found</div><p className="mt-2 text-sm text-muted">{error}</p><Link href={`/t/${tenantId}/app/tenancies`}><Button className="mt-5">Back to tenancies</Button></Link></div>;
  if (!tenancy) return <Skeleton className="mx-auto h-[520px] max-w-5xl" />;

  return <div className="mx-auto grid w-full max-w-6xl gap-5 pb-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href={`/t/${tenantId}/app/tenancies`} className="text-xs font-medium text-muted hover:text-teal">Tenancies / Details</Link><div className="mt-2 flex items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-teal">{tenancy.property.title}</h1><Badge tone={tenancyStatusTone(tenancy.status)}>{tenancy.status.toLowerCase()}</Badge></div><p className="mt-1 text-sm text-muted">{tenancy.property.address}</p></div><div className="flex gap-2"><Button variant="secondary">Edit tenancy</Button><Link href={`/t/${tenantId}/app/payments`}><Button>View payments</Button></Link></div></div><section className="card grid gap-5 p-5 sm:grid-cols-4"><Info label="Rent" value={`${formatMoney(tenancy.rentAmount, tenancy.currency)} / year`} /><Info label="Start date" value={formatDate(tenancy.startDate)} /><Info label="End date" value={tenancy.endDate ? formatDate(tenancy.endDate) : "Ongoing"} /><Info label="Tenant" value={tenancy.tenantUser?.name ?? "Unassigned"} /></section><div className="flex gap-2 border-b border-border pb-2">{(["overview", "agreement", "history"] as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-[4px] px-4 py-2 text-sm font-medium capitalize ${tab === item ? "bg-brand text-brand-ink" : "text-muted hover:bg-brand-soft"}`}>{item}</button>)}</div>{tab === "overview" ? <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><section className="card p-5"><h2 className="font-semibold text-teal">Tenancy overview</h2><div className="mt-4 grid gap-3 text-sm"><Info label="Property" value={tenancy.property.address} /><Info label="Landlord" value={tenancy.landlord?.name ?? "Not assigned"} /><Info label="Agent" value={tenancy.agent?.name ?? "No agent assigned"} /><Info label="Bedrooms" value={String(tenancy.property.bedrooms ?? "Not specified")} /></div></section><section className="card p-5"><h2 className="font-semibold text-teal">Tenancy actions</h2><div className="mt-4 grid gap-2"><Link href={`/t/${tenantId}/app/payments`}><Button variant="secondary" className="w-full">Record payment</Button></Link><Button variant="secondary">Upload agreement</Button><Button variant="secondary">Contact tenant</Button></div></section></div> : null}{tab === "agreement" ? <section className="card p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-teal">▤</div><h2 className="mt-4 font-semibold text-teal">Tenancy agreement</h2><p className="mt-2 text-sm text-muted">Upload or review the signed agreement for this tenancy.</p><Button className="mt-5">Upload agreement</Button></section> : null}{tab === "history" ? <section className="card p-5"><h2 className="font-semibold text-teal">Payment history</h2><p className="mt-2 text-sm text-muted">Payment activity for this tenancy is available in the payments workspace.</p><Link href={`/t/${tenantId}/app/payments`}><Button className="mt-5">Open payment history</Button></Link></section> : null}</div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-[4px] bg-brand-soft/50 p-3"><div className="text-xs text-muted">{label}</div><div className="mt-1 font-medium text-teal">{value}</div></div>; }
