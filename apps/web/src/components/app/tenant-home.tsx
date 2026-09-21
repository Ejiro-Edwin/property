"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
  const [createdPaymentId, setCreatedPaymentId] = React.useState<string | null>(null);

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
      const result = await api<{ payment?: { id?: string }; id?: string }>("payments/initiate", {
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
      setCreatedPaymentId(result.payment?.id ?? result.id ?? null);
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
    setCreatedPaymentId(null);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.045em] text-[#24211f]">{me ? `Good morning, ${me.name.split(" ")[0]} 👋` : "Good morning."}</h1>
          <p className="mt-1 text-base text-[#77716d]">Here&apos;s what&apos;s happening with your tenancy today.</p>
        </div>
        <Link href={`/t/${tenantId}/app/profile`} className="rounded-full border border-[#b9dcae] bg-[#f0ffe9] px-4 py-2 text-xs font-semibold text-[#45733b]">Tenant profile</Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#77716d]"><span>Current Property</span><span className="rounded-full bg-[#f0ffe9] px-2 py-1 text-[9px] font-bold text-[#45863b]">{tenancy?.status?.toLowerCase() ?? "Awaiting"}</span></div>
          <div className="mt-3 flex gap-3">
            <div className="property-art h-20 w-24 shrink-0 rounded-[6px]" />
            <div className="min-w-0"><div className="font-semibold text-[#24211f]">{property?.title ?? "No property assigned"}</div><div className="mt-1 text-xs text-[#77716d]">{property?.address ?? "Your property will appear here"}</div><div className="mt-2 text-[11px] text-[#77716d]">{tenancy ? `${formatMoney(tenancy.rentAmount, tenancy.currency)} / month` : "Awaiting tenancy"}</div></div>
          </div>
        </section>
        <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><div className="text-[11px] font-semibold text-[#77716d]">Rent Status</div><div className="mt-3 text-2xl font-semibold text-[#24211f]">{tenancy ? formatMoney(tenancy.rentAmount, tenancy.currency) : "--"}</div><div className="mt-1 text-xs text-[#77716d]">Next payment due</div><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => tenancy && setPayOpen(true)} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">Pay rent</Button><Link href={`/t/${tenantId}/app/my-tenancy`}><Button size="sm" variant="secondary">History</Button></Link></div></section>
        <section className="rounded-[8px] border border-[#dfe7e3] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><div className="text-[11px] font-semibold text-[#77716d]">Payment Overview</div><div className="mt-3 grid gap-2 text-xs"><div className="flex justify-between"><span className="text-[#77716d]">Payments made</span><span className="font-semibold">{payments?.length ?? 0}</span></div><div className="flex justify-between"><span className="text-[#77716d]">On time</span><span className="font-semibold text-[#45863b]">{trust?.summary.onTime ?? 0}</span></div><div className="flex justify-between"><span className="text-[#77716d]">Next due</span><span className="font-semibold">{payments?.[0]?.dueDate ? formatDate(payments[0].dueDate) : "--"}</span></div></div></section>
      </div>

      <section><div className="mb-2 text-sm font-semibold text-[#24211f]">Quick Actions</div><div className="rounded-[8px] border border-[#dfe7e3] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><Link href={`/t/${tenantId}/app/my-trust`} className="flex items-center justify-between"><span><span className="block text-sm font-semibold text-[#24211f]">Trust Profile</span><span className="block text-xs text-[#77716d]">Check your verified rental score</span></span><span className="text-xs font-semibold text-[#4c8b40]">View profile →</span></Link></div></section>

      {payOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="pay-rent-title">
          <div className="w-full max-w-md rounded-[10px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            {payState === "form" ? (
              <>
                <div className="flex items-start justify-between gap-4"><div><h2 id="pay-rent-title" className="text-lg font-semibold tracking-tight">Pay your rent</h2><p className="mt-1 text-sm text-muted">Review the amount before continuing.</p></div><button type="button" onClick={closePayment} className="text-sm text-muted hover:text-foreground" aria-label="Close">Close</button></div>
                <div className="mt-6 rounded-[4px] bg-[var(--auth-mint)] p-4"><div className="text-xs text-muted">Amount due</div><div className="mt-1 text-2xl font-bold text-teal">{formatMoney(tenancy?.rentAmount ?? 0, tenancy?.currency ?? "NGN")}</div><div className="mt-1 text-xs text-muted">{property?.title ?? "Current tenancy"}</div></div>
                <div className="mt-6 flex gap-3"><Button variant="secondary" className="flex-1" onClick={closePayment}>Cancel</Button><Button className="flex-1 bg-[var(--auth-lime)] text-teal hover:bg-[#a9eb00]" onClick={submitRentPayment}>Continue</Button></div>
              </>
            ) : payState === "processing" ? (
              <div className="py-8 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-teal border-t-transparent" /><h2 className="mt-5 text-lg font-semibold text-teal">Processing payment</h2><p className="mt-2 text-sm text-muted">Please wait while we confirm your payment.</p></div>
            ) : payState === "success" ? (
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--auth-lime)] text-xl text-teal">✓</div><h2 className="mt-5 text-lg font-semibold text-teal">Payment submitted</h2><p className="mt-2 text-sm text-muted">Your payment is pending landlord verification.</p><div className="mt-6 rounded-[4px] border border-border p-4 text-left"><div className="flex justify-between text-sm"><span className="text-muted">Amount submitted</span><span className="font-semibold">{formatMoney(tenancy?.rentAmount ?? 0, tenancy?.currency ?? "NGN")}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted">Property</span><span className="font-medium">{property?.title ?? "Current tenancy"}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted">Status</span><span className="font-medium text-warning">Pending verification</span></div></div>{createdPaymentId ? <Link href={`/t/${tenantId}/app/payments/${createdPaymentId}`} className="mt-6 block text-sm font-semibold text-[#004b49] hover:underline">View receipt</Link> : null}<Button className="mt-4 w-full" onClick={closePayment}>Done</Button></div>
            ) : (
              <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#ff6b6b] bg-[#fff1f1] text-[#ff4f4f]">×</div><h2 className="mt-5 text-lg font-semibold text-[#004b49]">Payment unsuccessful</h2><p className="mt-2 text-sm leading-5 text-[#71817e]">We couldn&apos;t process your payment. Please check your payment details and try again.</p><div className="mt-6 flex items-center justify-center gap-5"><button type="button" className="text-xs font-semibold text-[#24211f]" onClick={closePayment}>Use another method</button><Button className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => setPayState("form")}>Try again</Button></div></div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
