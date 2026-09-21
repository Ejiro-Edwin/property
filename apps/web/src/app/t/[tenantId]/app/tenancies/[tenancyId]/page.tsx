"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Tenancy = {
  id: string;
  status: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  endDate?: string | null;
  property: {
    title: string;
    address: string;
    bedrooms?: number | null;
    amenities?: { name: string }[];
    rules?: { title: string }[];
  };
  tenantUser?: { name: string; email: string };
  landlord?: { name: string; email: string };
  agent?: { name: string; email: string } | null;
};

type Tab = "overview" | "agreement" | "history";

export default function TenancyDetailPage() {
  const { tenantId, tenancyId } = useParams<{ tenantId: string; tenancyId: string }>();
  const [tenancy, setTenancy] = React.useState<Tenancy | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => {
    api<{ tenancy: Tenancy }>(`tenancies/${tenancyId}`, { tenantId })
      .then((result) => setTenancy(result.tenancy))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load tenancy"));
  }, [tenantId, tenancyId]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center">
        <div className="text-lg font-semibold text-[#0f172a]">Tenancy not found</div>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <Link href={`/t/${tenantId}/app/tenancies`}>
          <Button className="mt-5 bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">
            Back to tenancies
          </Button>
        </Link>
      </div>
    );
  }

  if (!tenancy) return <Skeleton className="mx-auto h-[520px] max-w-5xl" />;

  const amenityList = tenancy.property.amenities?.map((item) => item.name) ?? [];
  const ruleList = tenancy.property.rules?.map((item) => item.title) ?? [];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        eyebrow="Tenancy details"
        title={tenancy.property.title}
        description={tenancy.property.address}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100">
              Edit tenancy
            </Button>
            <Link href={`/t/${tenantId}/app/payments`}>
              <Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">View payments</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Rent" value={`${formatMoney(tenancy.rentAmount, tenancy.currency)} / year`} />
        <Stat label="Start date" value={formatDate(tenancy.startDate)} />
        <Stat label="End date" value={tenancy.endDate ? formatDate(tenancy.endDate) : "Ongoing"} />
        <Stat label="Tenant" value={tenancy.tenantUser?.name ?? "Unassigned"} />
      </section>

      <div className="flex gap-5 border-b border-[#dfe7e3] px-1">
        {(["overview", "agreement", "history"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium capitalize transition-colors ${
              tab === item ? "border-[#baff00] text-[#004b49]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="card rounded-[8px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
            <h2 className="text-lg font-semibold text-[#0f172a]">Tenancy overview</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Property" value={tenancy.property.address} />
              <Info label="Landlord" value={tenancy.landlord?.name ?? "Not assigned"} />
              <Info label="Agent" value={tenancy.agent?.name ?? "No agent assigned"} />
              <Info label="Bedrooms" value={String(tenancy.property.bedrooms ?? "Not specified")} />
            </div>
          </section>

          <section className="card rounded-[8px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0f172a]">Status summary</h2>
              <Badge tone={tenancyStatusTone(tenancy.status)}>{tenancy.status.toLowerCase()}</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3">
                Current tenancy record is active within the workspace and linked to the selected property.
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3">
                Payment and trust activity can be reviewed from the associated payment and trust views.
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "agreement" ? (
        <section className="card rounded-[8px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-lg font-semibold text-[#0f172a]">Agreement details</h2>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Rent amount" value={formatMoney(tenancy.rentAmount, tenancy.currency)} />
            <Info label="Payment frequency" value="Annual" />
            <Info label="Start date" value={formatDate(tenancy.startDate)} />
            <Info label="End date" value={tenancy.endDate ? formatDate(tenancy.endDate) : "Ongoing"} />
            <Info label="Tenant contact" value={tenancy.tenantUser?.email ?? "Not provided"} />
            <Info label="Landlord contact" value={tenancy.landlord?.email ?? "Not provided"} />
          </div>
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="card rounded-[8px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-lg font-semibold text-[#0f172a]">Property activity</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Amenities</div>
              <div className="space-y-2">
                {amenityList.length ? (
                  amenityList.map((item) => (
                    <div key={item} className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3 text-sm text-slate-700">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-slate-200 bg-[#f8fafc] p-3 text-sm text-slate-600">
                    No amenities recorded.
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">House rules</div>
              <div className="space-y-2">
                {ruleList.length ? (
                  ruleList.map((item) => (
                    <div key={item} className="rounded-[14px] border border-slate-200 bg-[#f8fafc] p-3 text-sm text-slate-700">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-slate-200 bg-[#f8fafc] p-3 text-sm text-slate-600">
                    No rules recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
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
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-[#0f172a]">{value}</div>
    </div>
  );
}
