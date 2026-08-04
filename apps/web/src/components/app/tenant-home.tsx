"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, paymentStatusTone, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Me = { id: string; name: string; email: string };
type Tenancy = {
  id: string;
  propertyId: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  status: string;
};
type Property = { id: string; title: string; address: string };
type Payment = { id: string; amount: number; currency: string; status: string; dueDate: string | null };
type TrustProfile = { trustScore: number; summary: { onTime: number; late: number; missed: number } };

export function TenantHome() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [me, setMe] = React.useState<Me | null>(null);
  const [tenancy, setTenancy] = React.useState<Tenancy | null>(null);
  const [property, setProperty] = React.useState<Property | null>(null);
  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [trust, setTrust] = React.useState<TrustProfile | null>(null);

  React.useEffect(() => {
    api<{ user: Me }>("auth/me", { tenantId }).then((r) => setMe(r.user)).catch(() => setMe(null));

    api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 5 } })
      .then(async (r) => {
        const items = r.tenancies ?? [];
        const active = items.find((t) => t.status === "ACTIVE") ?? items[0] ?? null;
        setTenancy(active);
        if (active) {
          const props = await api<{ properties: Property[] }>("properties", {
            tenantId,
            query: { limit: 50 },
          });
          setProperty(props.properties?.find((p) => p.id === active.propertyId) ?? null);
        }
      })
      .catch(() => setTenancy(null));

    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 5 } })
      .then((r) => setPayments(r.payments ?? []))
      .catch(() => setPayments([]));
  }, [tenantId]);

  React.useEffect(() => {
    if (!me?.id) return;
    api<TrustProfile>(`trust/${me.id}`, { tenantId })
      .then(setTrust)
      .catch(() => setTrust(null));
  }, [me?.id, tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <section className="card p-6 sm:p-8">
        <Badge tone="brand" className="w-fit">
          Tenant portal
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {me ? `Hi, ${me.name.split(" ")[0]}` : "Welcome"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          View your tenancy, rent payments and trust score — all in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/t/${tenantId}/app/my-tenancy`}>
            <Button>My tenancy</Button>
          </Link>
          <Link href={`/t/${tenantId}/app/payments`}>
            <Button variant="secondary">My payments</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Trust score</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-success">
            {trust ? trust.trustScore : "…"}
          </div>
          <div className="mt-1 text-xs text-muted">Based on your payment history</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Tenancy</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">
            {tenancy ? (
              <Badge tone={tenancyStatusTone(tenancy.status)}>{tenancy.status.toLowerCase()}</Badge>
            ) : (
              "None"
            )}
          </div>
          <div className="mt-1 text-xs text-muted">
            {property?.title ?? "Not assigned yet"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Recent payments</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : payments.length}
          </div>
          <div className="mt-1 text-xs text-muted">Recorded for you</div>
        </div>
      </div>

      {tenancy && property ? (
        <section className="card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Current home</h2>
          <div className="mt-3 grid gap-1">
            <div className="text-base font-medium">{property.title}</div>
            <div className="text-sm text-muted">{property.address}</div>
            <div className="mt-2 text-sm">
              {formatMoney(tenancy.rentAmount, tenancy.currency)} / yr · from{" "}
              {formatDate(tenancy.startDate)}
            </div>
          </div>
        </section>
      ) : (
        <section className="card p-5 text-sm text-muted">
          You don&apos;t have an active tenancy yet. Your landlord will set this up and
          you&apos;ll see your property details here.
        </section>
      )}

      {payments && payments.length > 0 ? (
        <section className="card divide-y divide-border">
          <div className="px-5 py-3 text-sm font-semibold tracking-tight">Recent payments</div>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm font-medium">{formatMoney(p.amount, p.currency)}</div>
                <div className="text-xs text-muted">{formatDate(p.dueDate)}</div>
              </div>
              <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>
            </div>
          ))}
        </section>
      ) : payments !== null ? (
        <section className="card p-5 text-sm text-muted">No payments recorded yet.</section>
      ) : (
        <Skeleton className="h-[120px]" />
      )}
    </div>
  );
}
