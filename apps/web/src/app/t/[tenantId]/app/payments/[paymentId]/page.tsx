"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type Payment = { id: string; amount: number; currency: string; status: string; dueDate: string | null; createdAt: string; tenancyId: string };
type Property = { id: string; title: string; address: string };
type Tenancy = { id: string; propertyId: string; tenantUserId: string };

export default function PaymentReceiptPage() {
  const { tenantId, paymentId } = useParams<{ tenantId: string; paymentId: string }>();
  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [property, setProperty] = React.useState<Property | null>(null);
  const [tenancy, setTenancy] = React.useState<Tenancy | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 100 } }),
      api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 100 } }),
      api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 100 } }),
    ]).then(([payments, properties, tenancies]) => {
      const item = payments.payments?.find((entry) => entry.id === paymentId) ?? null;
      setPayment(item);
      const match = item ? tenancies.tenancies?.find((entry) => entry.id === item.tenancyId) : null;
      setTenancy(match ?? null);
      setProperty(match ? properties.properties?.find((entry) => entry.id === match.propertyId) ?? null : null);
    }).catch(() => setPayment(null));
  }, [tenantId, paymentId]);

  if (!payment) return <Skeleton className="mx-auto h-[420px] max-w-3xl" />;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-7 flex items-center gap-2 text-sm font-semibold text-[#004b49]"><Link href={`/t/${tenantId}/app/payments`} className="hover:underline">←</Link><Link href={`/t/${tenantId}/app/payments`} className="hover:underline">Back to Payments</Link></div>
      <div className="mx-auto max-w-[520px] rounded-[10px] border border-[#dfe7e3] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="flex items-center justify-between border-b border-[#dfe7e3] pb-4"><div className="flex items-center gap-2 text-sm font-bold text-[#004b49]"><span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#baff00] text-[#004b49]">₦</span>TenantSea Receipt</div><Badge tone="success">{payment.status.toLowerCase()}</Badge></div>
        <div className="border-b border-dashed border-[#cfdad3] py-7 text-center"><div className="text-[10px] uppercase tracking-[0.16em] text-[#71817e]">Amount transacted</div><div className="mt-2 text-4xl font-bold tracking-[-0.05em] text-[#004b49]">{formatMoney(payment.amount, payment.currency)}</div><div className="mt-2 text-[10px] text-[#71817e]">Transacted successfully on {formatDateTime(payment.createdAt)}</div></div>
        <div className="grid gap-3 py-5 text-xs"><ReceiptRow label="Transaction ID" value={payment.id} /><ReceiptRow label="Property Address" value={property?.address ?? "Current tenancy"} /><ReceiptRow label="Description" value="Monthly Rent" /><ReceiptRow label="Payment Method" value="Debit Card" /><ReceiptRow label="Billed To" value="Tenant account" /></div>
        <div className="flex gap-3 border-t border-[#dfe7e3] pt-4"><Button className="flex-1 bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => window.print()}>Download PDF Receipt</Button><Button variant="secondary" className="flex-1" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share Receipt</Button></div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-5"><span className="text-[#71817e]">{label}</span><span className="text-right font-semibold text-[#24211f]">{value}</span></div>;
}