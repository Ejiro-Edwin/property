"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Tenancy = { id: string; propertyId: string; tenantUserId: string; rentAmount: number; currency: string };
type Property = { id: string; title: string };
type Member = { id: string; name: string; role: string };

type FormState = { tenancyId: string; payerId: string; amount: string; dueDate: string; paymentType: string };

export default function RecordPaymentPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenancies, setTenancies] = React.useState<Tenancy[]>([]);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [state, setState] = React.useState<"form" | "success" | "error">("form");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({ tenancyId: "", payerId: "", amount: "", dueDate: "", paymentType: "rent" });

  React.useEffect(() => {
    Promise.all([
      api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 100 } }),
      api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 100 } }),
      api<{ users: Member[] }>("users", { tenantId, query: { limit: 100 } }),
    ]).then(([tenanciesResult, propertiesResult, usersResult]) => {
      setTenancies(tenanciesResult.tenancies ?? []);
      setProperties(propertiesResult.properties ?? []);
      setMembers(usersResult.users ?? []);
    }).catch(() => setError("Could not load payment options"));
  }, [tenantId]);

  function selectTenancy(tenancyId: string) {
    const tenancy = tenancies.find((item) => item.id === tenancyId);
    setForm((current) => ({ ...current, tenancyId, payerId: tenancy?.tenantUserId ?? "", amount: tenancy ? String(tenancy.rentAmount) : "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("payments/initiate", { method: "POST", tenantId, body: { tenantId, tenancyId: form.tenancyId, payerId: form.payerId, amount: Number(form.amount), currency: "NGN", ...(form.dueDate ? { dueDate: form.dueDate } : {}) } });
      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "We couldn't record the payment. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const selected = tenancies.find((item) => item.id === form.tenancyId);
  const property = properties.find((item) => item.id === selected?.propertyId);
  const payer = members.find((item) => item.id === form.payerId);

  return (
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <PageHeader eyebrow="Payments" title="Record Payment" description="Record a payment received from a tenant." action={<Link href={`/t/${tenantId}/app/payments`} className="text-sm font-semibold text-[#45863b]">Back to payments</Link>} />
      {state === "success" ? <section className="mx-auto w-full max-w-[440px] rounded-[10px] border border-[#dfe7e3] bg-white p-8 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#baff00] text-xl font-bold text-[#004b49]">✓</div><h2 className="mt-5 text-lg font-bold text-[#004b49]">Payment recorded successfully</h2><p className="mt-2 text-sm text-[#71817e]">{form.amount ? `₦${Number(form.amount).toLocaleString()} ` : "The payment "}was recorded for {payer?.name ?? "the tenant"}.</p><Button className="mt-6 w-full bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => setState("form")}>View Payment</Button><Link href={`/t/${tenantId}/app`} className="mt-3 block text-xs text-[#71817e]">Back to Dashboard</Link></section> : state === "error" ? <section className="mx-auto w-full max-w-[440px] rounded-[10px] border border-[#dfe7e3] bg-white p-8 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] text-[#ff4f4f]">!</div><h2 className="mt-5 text-lg font-bold text-[#004b49]">We couldn&apos;t record the payment</h2><p className="mt-2 text-sm text-[#71817e]">{error}</p><Button className="mt-6 w-full bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => setState("form")}>Try Again</Button><Button variant="secondary" className="mt-3 w-full" onClick={() => setState("form")}>Contact Support</Button></section> : <form className="mx-auto w-full max-w-[560px] rounded-[10px] border border-[#dfe7e3] bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]" onSubmit={submit}><div className="grid gap-4"><label className="grid gap-2 text-xs font-semibold text-[#4f5b57]">Select property<Select value={form.tenancyId} onChange={(event) => selectTenancy(event.target.value)} required><option value="">Select property</option>{tenancies.map((tenancy) => <option key={tenancy.id} value={tenancy.id}>{properties.find((item) => item.id === tenancy.propertyId)?.title ?? tenancy.propertyId}</option>)}</Select></label><label className="grid gap-2 text-xs font-semibold text-[#4f5b57]">Select tenant<Select value={form.payerId} onChange={(event) => setForm({ ...form, payerId: event.target.value })} required><option value="">Select tenant</option>{members.filter((member) => member.role.toLowerCase() === "tenant").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-xs font-semibold text-[#4f5b57]">Amount received<Input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="₦250,000" required /></label><label className="grid gap-2 text-xs font-semibold text-[#4f5b57]">Payment date<Input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required /></label></div><div className="grid gap-2 text-xs font-semibold text-[#4f5b57]">Payment type<div className="flex gap-4 rounded-[8px] border border-[#dfe7e3] p-3 font-normal"><label><input type="radio" checked={form.paymentType === "rent"} onChange={() => setForm({ ...form, paymentType: "rent" })} /> Rent</label><label><input type="radio" checked={form.paymentType === "deposit"} onChange={() => setForm({ ...form, paymentType: "deposit" })} /> Security deposit</label><label><input type="radio" checked={form.paymentType === "other"} onChange={() => setForm({ ...form, paymentType: "other" })} /> Other</label></div></div><div className="flex justify-end gap-3 pt-2"><Link href={`/t/${tenantId}/app/payments`}><Button type="button" variant="secondary">Cancel</Button></Link><Button disabled={busy} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">{busy ? "Recording…" : "Record Payment"}</Button></div></div></form>}
    </div>
  );
}