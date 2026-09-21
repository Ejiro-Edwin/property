"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Tenancy = {
  id: string;
  propertyId: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  status: string;
};

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
};

export default function MyTenancyPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [tenancies, setTenancies] = React.useState<Tenancy[] | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loadError, setLoadError] = React.useState(false);

  function loadTenancy() {
    setTenancies(null);
    setLoadError(false);
    api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 20 } })
      .then((r) => setTenancies(r.tenancies ?? []))
      .catch(() => {
        setLoadError(true);
        setTenancies([]);
      });
  }

  React.useEffect(() => {
    loadTenancy();
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 20 } })
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]));
  }, [tenantId]);

  const propertyMap = React.useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties],
  );

  return (
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <PageHeader
        eyebrow="My tenancy"
        title="Overview"
        description="View and manage your tenancy information, agreement and property."
        action={
          <div className="flex gap-2"><Link href={`/t/${tenantId}/app/payments`}><Button className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">View payments</Button></Link><Button variant="secondary">Contact landlord / agent</Button></div>
        }
      />

      {tenancies === null ? (
        <Skeleton className="h-[240px]" />
      ) : loadError ? (
        <EmptyState
          title="We couldn&apos;t load your tenancy"
          body="Something went wrong while fetching your tenancy details."
          action={<Button onClick={loadTenancy}>Try again</Button>}
        />
      ) : tenancies.length === 0 ? (
        <EmptyState
          title="Tenancy record not found"
          body="We couldn&apos;t find a tenancy connected to this workspace."
          action={<Button onClick={loadTenancy}>Refresh</Button>}
        />
      ) : (
        <div className="grid gap-5">
          {tenancies.map((t) => {
            const property = propertyMap.get(t.propertyId);
            const terminated = t.status.toLowerCase() === "terminated";
            return (
              <div key={t.id} className="grid gap-5">
                <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                  <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71817e]">Current tenancy</div><h2 className="mt-2 text-xl font-bold text-[#24211f]">{terminated ? "Terminated Tenancy" : property?.title ?? "Your property"}</h2><div className="mt-1 text-sm text-[#77716d]">{property?.address ?? "Property details pending"}</div></div><Badge tone={tenancyStatusTone(t.status)}>{t.status.toLowerCase()}</Badge></div>
                  <div className="mt-5 grid gap-4 border-t border-[#e5ebe6] pt-5 sm:grid-cols-3"><Info label="Tenancy starts" value={formatDate(t.startDate)} /><Info label="Tenancy ends" value={t.endDate ? formatDate(t.endDate) : "Ongoing"} /><Info label="Rent status" value={`${formatMoney(t.rentAmount, t.currency)} / month`} /></div>
                  <div className="mt-6 rounded-[8px] bg-[#f2fff0] p-4"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#71817e]"><span>Tenancy timeline</span><span>{t.status.toLowerCase()}</span></div><div className="mt-4 flex items-center"><div className="h-3 w-3 rounded-full bg-[#baff00] ring-4 ring-[#e9f8df]" /><div className="h-1 flex-1 bg-[#baff00]" /><div className={`h-3 w-3 rounded-full ring-4 ${t.endDate ? "bg-[#baff00] ring-[#e9f8df]" : "bg-white ring-[#dce8dc]"}`} /><div className={`h-1 flex-1 ${t.endDate ? "bg-[#baff00]" : "bg-[#dce8dc]"}`} /><div className="h-3 w-3 rounded-full bg-white ring-4 ring-[#dce8dc]" /></div><div className="mt-2 flex justify-between text-[10px] text-[#71817e]"><span>Lease start</span><span>Today</span><span>Lease end</span></div></div>
                </section>
                <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><div className="text-sm font-semibold text-[#24211f]">Property details</div><div className="mt-4 flex gap-3"><div className="property-art h-16 w-20 rounded-[6px]" /><div><div className="font-semibold text-[#24211f]">{property?.title ?? "Your property"}</div><div className="mt-1 text-xs text-[#77716d]">{property?.bedrooms ?? "--"} bedrooms · Apartment</div></div></div><Button size="sm" variant="secondary" className="mt-4 w-full">View property</Button></section><section className="rounded-[8px] border border-[#dfe7e3] bg-white p-5"><div className="text-sm font-semibold text-[#24211f]">Rent status</div><div className="mt-3 text-2xl font-bold text-[#45863b]">{formatMoney(t.rentAmount, t.currency)}</div><div className="text-xs text-[#77716d]">Monthly rent · next due soon</div><Link href={`/t/${tenantId}/app/payments`}><Button size="sm" variant="secondary" className="mt-4 w-full">View payment history</Button></Link></section></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#71817e]">{label}</div><div className="mt-1 text-sm font-semibold text-[#24211f]">{value}</div></div>;
}
