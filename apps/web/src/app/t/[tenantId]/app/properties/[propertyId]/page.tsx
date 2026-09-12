"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

 type Property = { id: string; title: string; address: string; bedrooms: number | null; rentAmount: number; currency: string; amenities?: { id: string; name: string }[]; rules?: { id: string; title: string; details?: string | null }[] };
 type Tab = "overview" | "amenities" | "rules";

export default function PropertyDetailPage() {
  const { tenantId, propertyId } = useParams<{ tenantId: string; propertyId: string }>();
  const [property, setProperty] = React.useState<Property | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => {
    api<{ property: Property }>(`properties/${propertyId}`, { tenantId }).then((result) => setProperty(result.property)).catch((err) => setError(err instanceof ApiError ? err.message : "Could not load property"));
  }, [propertyId, tenantId]);

  if (error) return <div className="mx-auto max-w-5xl py-12 text-center"><div className="text-lg font-semibold text-teal">Property not found</div><p className="mt-2 text-sm text-muted">{error}</p><Link href={`/t/${tenantId}/app/properties`}><Button className="mt-5">Back to properties</Button></Link></div>;
  if (!property) return <Skeleton className="mx-auto h-[520px] max-w-5xl" />;

  return <div className="mx-auto grid w-full max-w-6xl gap-5 pb-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={`/t/${tenantId}/app/properties`} className="text-xs font-medium text-muted hover:text-teal">Properties / Overview</Link><h1 className="mt-2 text-3xl font-bold tracking-tight text-teal">{property.title}</h1><p className="mt-1 text-sm text-muted">{property.address}</p></div><div className="flex gap-2"><Button variant="secondary">Edit property</Button><Button>Share property</Button></div></div><div className="property-hero h-64 rounded-[4px] sm:h-80"><div className="flex h-full items-end bg-gradient-to-t from-teal/80 via-transparent to-transparent p-6"><div className="text-white"><div className="text-xs font-bold uppercase tracking-[0.18em] text-lime">Active property</div><div className="mt-2 text-2xl font-bold">{property.address}</div></div></div></div><div className="grid gap-3 sm:grid-cols-3"><Stat label="Annual rent" value={formatMoney(property.rentAmount, property.currency)} /><Stat label="Bedrooms" value={String(property.bedrooms ?? "-")} /><Stat label="Status" value="Available" /></div><div className="flex gap-2 border-b border-border pb-2">{(["overview", "amenities", "rules"] as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-[4px] px-4 py-2 text-sm font-medium capitalize ${tab === item ? "bg-brand text-brand-ink" : "text-muted hover:bg-brand-soft"}`}>{item}</button>)}</div>{tab === "overview" ? <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><section className="card p-5"><h2 className="font-semibold text-teal">Property overview</h2><p className="mt-3 text-sm leading-6 text-muted">Manage the property details, occupancy, amenities, and house rules from one place.</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><Info label="Address" value={property.address} /><Info label="Bedrooms" value={String(property.bedrooms ?? "Not specified")} /><Info label="Rent" value={`${formatMoney(property.rentAmount, property.currency)} / year`} /><Info label="Listing status" value="Available" /></div></section><section className="card p-5"><h2 className="font-semibold text-teal">Quick actions</h2><div className="mt-4 grid gap-2"><Button variant="secondary">Add amenity</Button><Button variant="secondary">Add house rule</Button><Link href={`/t/${tenantId}/app/tenancies`}><Button variant="secondary" className="w-full">View tenancies</Button></Link></div></section></div> : null}{tab === "amenities" ? <FeatureList title="Property amenities" empty="No amenities added yet." items={(property.amenities ?? []).map((item) => item.name)} /> : null}{tab === "rules" ? <FeatureList title="House rules" empty="No house rules added yet." items={(property.rules ?? []).map((item) => item.details ? `${item.title}: ${item.details}` : item.title)} /> : null}</div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="card p-4"><div className="text-xs uppercase tracking-wide text-muted">{label}</div><div className="mt-2 text-xl font-bold text-teal">{value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-[4px] bg-brand-soft/50 p-3"><div className="text-xs text-muted">{label}</div><div className="mt-1 font-medium text-teal">{value}</div></div>; }
function FeatureList({ title, empty, items }: { title: string; empty: string; items: string[] }) { return <section className="card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-teal">{title}</h2><Button size="sm">Add</Button></div>{items.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => <div key={item} className="rounded-[4px] border border-border p-4 text-sm">{item}</div>)}</div> : <div className="mt-6 text-sm text-muted">{empty}</div>}</section>; }
