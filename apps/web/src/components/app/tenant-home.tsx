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
    <div className="mx-auto grid w-full max-w-6xl gap-5 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-[18px] border border-[#dfe7e3] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1f6b67]">Tenant workspace</p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.04em] text-[#0f172a]">{me ? `Good morning, ${me.name.split(" ")[0]}.` : "Welcome back."}</h1>
          <p className="mt-1 text-sm text-slate-600">Your home, payments, and trust profile at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/t/${tenantId}/app/my-tenancy`}>
            <Button variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100">My tenancy</Button>
          </Link>
          <Link href={`/t/${tenantId}/app/payments`}>
            <Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">My payments</Button>
          </Link>
          {tenancy ? <Button onClick={() => setPayOpen(true)} className="bg-[#0d1b1d] text-white hover:bg-[#18282a]">Pay rent</Button> : null}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Trust score</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f8b68]">{trust ? trust.trustScore : "…"}</div>
          <div className="mt-1 text-xs text-slate-500">Based on your payment history</div>
        </div>
        <div className="metric-card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Tenancy</div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-[#0f172a]">
            {tenancy ? (
              <Badge tone={tenancyStatusTone(tenancy.status)}>{tenancy.status.toLowerCase()}</Badge>
            ) : (
              "None"
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500">{property?.title ?? "Not assigned yet"}</div>
        </div>
        <div className="metric-card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Recent payments</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{payments === null ? "…" : payments.length}</div>
          <div className="mt-1 text-xs text-slate-500">Recorded for you</div>
        </div>
      </div>

      {tenancy && property ? (
        <section className="card rounded-[22px] p-5">
          <h2 className="text-sm font-semibold tracking-tight text-[#0f172a]">Current home</h2>
          <div className="mt-3 grid gap-1">
            <div className="text-base font-medium text-[#0f172a]">{property.title}</div>
            <div className="text-sm text-slate-600">{property.address}</div>
            <div className="mt-2 text-sm text-slate-700">
              {formatMoney(tenancy.rentAmount, tenancy.currency)} / yr · from{" "}
              {formatDate(tenancy.startDate)}
            </div>
          </div>
        </section>
      ) : (
        <section className="card rounded-[22px] p-5 text-sm text-slate-600">
          You don&apos;t have an active tenancy yet. Your landlord will set this up and
          you&apos;ll see your property details here.
        </section>
      )}

      {payments && payments.length > 0 ? (
        <section className="card divide-y divide-slate-200 overflow-hidden rounded-[22px]">
          <div className="px-5 py-3 text-sm font-semibold tracking-tight text-[#0f172a]">Recent payments</div>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm font-medium text-[#0f172a]">{formatMoney(p.amount, p.currency)}</div>
                <div className="text-xs text-slate-500">{formatDate(p.dueDate)}</div>
              </div>
              <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>
            </div>
          ))}
        </section>
      ) : payments !== null ? (
        <section className="card rounded-[22px] p-5 text-sm text-slate-600">No payments recorded yet.</section>
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
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--auth-lime)] text-xl text-teal">✓</div><h2 className="mt-5 text-lg font-semibold text-teal">Payment submitted</h2><p className="mt-2 text-sm text-muted">Your payment is pending landlord verification.</p><div className="mt-6 rounded-[4px] border border-border p-4 text-left"><div className="flex justify-between text-sm"><span className="text-muted">Amount submitted</span><span className="font-semibold">{formatMoney(tenancy?.rentAmount ?? 0, tenancy?.currency ?? "NGN")}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted">Property</span><span className="font-medium">{property?.title ?? "Current tenancy"}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted">Status</span><span className="font-medium text-warning">Pending verification</span></div></div><Button className="mt-6 w-full" onClick={closePayment}>Done</Button></div>
            ) : (
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">!</div><h2 className="mt-5 text-lg font-semibold text-teal">Payment failed</h2><p className="mt-2 text-sm text-muted">{payError ?? "We could not complete your payment."}</p><div className="mt-6 flex gap-3"><Button variant="secondary" className="flex-1" onClick={closePayment}>Close</Button><Button className="flex-1" onClick={() => setPayState("form")}>Try again</Button></div></div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
