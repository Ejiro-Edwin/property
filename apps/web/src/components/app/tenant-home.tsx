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
  const [payOpen, setPayOpen] = React.useState(false);
  const [payState, setPayState] = React.useState<"form" | "processing" | "success" | "failed">("form");
  const [payError, setPayError] = React.useState<string | null>(null);

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

  async function submitRentPayment() {
    if (!me || !tenancy) return;
    setPayState("processing");
    setPayError(null);
    try {
      await api("payments/initiate", {
        method: "POST",
        tenantId,
        body: {
          tenantId,
          tenancyId: tenancy.id,
          payerId: me.id,
          amount: tenancy.rentAmount,
          currency: tenancy.currency,
        },
      });
      setPayState("success");
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment could not be completed");
      setPayState("failed");
    }
  }

  function closePayment() {
    setPayOpen(false);
    setPayState("form");
    setPayError(null);
  }

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
          {tenancy ? <Button onClick={() => setPayOpen(true)}>Pay rent</Button> : null}
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

      {payOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="pay-rent-title">
          <div className="w-full max-w-md rounded-[4px] bg-white p-6 shadow-2xl">
            {payState === "form" ? (
              <>
                <div className="flex items-start justify-between gap-4"><div><h2 id="pay-rent-title" className="text-lg font-semibold tracking-tight">Pay your rent</h2><p className="mt-1 text-sm text-muted">Review the amount before continuing.</p></div><button type="button" onClick={closePayment} className="text-sm text-muted hover:text-foreground" aria-label="Close">Close</button></div>
                <div className="mt-6 rounded-[4px] bg-[var(--auth-mint)] p-4"><div className="text-xs text-muted">Amount due</div><div className="mt-1 text-2xl font-bold text-teal">{formatMoney(tenancy?.rentAmount ?? 0, tenancy?.currency ?? "NGN")}</div><div className="mt-1 text-xs text-muted">{property?.title ?? "Current tenancy"}</div></div>
                <div className="mt-6 flex gap-3"><Button variant="secondary" className="flex-1" onClick={closePayment}>Cancel</Button><Button className="flex-1 bg-[var(--auth-lime)] text-teal hover:bg-[#a9eb00]" onClick={submitRentPayment}>Continue</Button></div>
              </>
            ) : payState === "processing" ? (
              <div className="py-8 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-teal border-t-transparent" /><h2 className="mt-5 text-lg font-semibold text-teal">Processing payment</h2><p className="mt-2 text-sm text-muted">Please wait while we confirm your payment.</p></div>
            ) : payState === "success" ? (
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--auth-lime)] text-xl text-teal">✓</div><h2 className="mt-5 text-lg font-semibold text-teal">Payment successful</h2><p className="mt-2 text-sm text-muted">Your rent payment has been recorded.</p><div className="mt-6 rounded-[4px] border border-border p-4 text-left"><div className="flex justify-between text-sm"><span className="text-muted">Amount paid</span><span className="font-semibold">{formatMoney(tenancy?.rentAmount ?? 0, tenancy?.currency ?? "NGN")}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted">Property</span><span className="font-medium">{property?.title ?? "Current tenancy"}</span></div></div><Button className="mt-6 w-full" onClick={closePayment}>Done</Button></div>
            ) : (
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">!</div><h2 className="mt-5 text-lg font-semibold text-teal">Payment failed</h2><p className="mt-2 text-sm text-muted">{payError ?? "We could not complete your payment."}</p><div className="mt-6 flex gap-3"><Button variant="secondary" className="flex-1" onClick={closePayment}>Close</Button><Button className="flex-1" onClick={() => setPayState("form")}>Try again</Button></div></div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
