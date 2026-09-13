"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
  amenities?: { id: string; name: string }[];
  rules?: { id: string; title: string; details?: string | null }[];
};

type Tab = "overview" | "amenities" | "rules";

export default function PropertyDetailPage() {
  const { tenantId, propertyId } = useParams<{ tenantId: string; propertyId: string }>();
  const [property, setProperty] = React.useState<Property | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => {
    api<{ property: Property }>(`properties/${propertyId}`, { tenantId })
      .then((result) => setProperty(result.property))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load property"));
  }, [propertyId, tenantId]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center">
        <div className="text-lg font-semibold text-[#0f172a]">Property not found</div>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <Link href={`/t/${tenantId}/app/properties`}>
          <Button className="mt-5 bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">
            Back to properties
          </Button>
        </Link>
      </div>
    );
  }

  if (!property) return <Skeleton className="mx-auto h-[520px] max-w-5xl" />;

  const amenities = property.amenities?.map((item) => item.name) ?? [];
  const rules = property.rules?.map((item) => item.title) ?? [];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        eyebrow="Property overview"
        title={property.title}
        description={property.address}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100">
              Edit property
            </Button>
            <Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Share property</Button>
          </div>
        }
      />

      <div className="property-art h-64 overflow-hidden rounded-[20px] shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:h-80">
        <div className="flex h-full items-end bg-gradient-to-t from-[#0f172a]/75 via-transparent to-transparent p-6">
          <div className="text-white">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#baff00]">Active property</div>
            <div className="mt-2 text-2xl font-bold">{property.address}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Annual rent" value={formatMoney(property.rentAmount, property.currency)} />
        <Stat label="Bedrooms" value={String(property.bedrooms ?? "-")} />
        <Stat label="Status" value="Available" />
      </div>

      <div className="flex gap-2 rounded-[12px] border border-[#dfe7e3] bg-[#f8faf9] p-1 shadow-sm">
        {(["overview", "amenities", "rules"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-[10px] px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === item ? "bg-[#efffee] text-[#004b49]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="card rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-[#0f172a]">Property overview</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage the property details, occupancy, amenities, and house rules from one place.
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Address" value={property.address} />
              <Info label="Bedrooms" value={String(property.bedrooms ?? "Not specified")} />
              <Info label="Rent" value={formatMoney(property.rentAmount, property.currency)} />
              <Info label="Type" value="Residential" />
            </div>
          </section>

          <section className="card rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0f172a]">Workspace notes</h2>
              <Badge tone="brand">Live</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3">
                Coverage is configured for this property and linked to the active workspace.
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3">
                Shared details are visible to the assigned landlord, agent, and tenant roles.
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "amenities" ? (
        <FeatureList
          title="Amenities"
          empty="No amenities have been added to this property yet."
          items={amenities}
        />
      ) : null}

      {tab === "rules" ? (
        <FeatureList
          title="House rules"
          empty="No rules are listed for this property yet."
          items={rules}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card p-5">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#0f172a]">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-[#0f172a]">{value}</div>
    </div>
  );
}

function FeatureList({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <section className="card rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
        <Button size="sm" className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">
          Add
        </Button>
      </div>

      {items.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-4 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-sm text-slate-600">{empty}</div>
      )}
    </section>
  );
}
