"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function AddTenantPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", propertyId: "", startDate: "", endDate: "", rent: "" });
  const [properties, setProperties] = React.useState<{ id: string; title: string }[]>([]);
  const [state, setState] = React.useState<"form" | "success" | "error">("form");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { api<{ properties: { id: string; title: string }[] }>("properties", { tenantId, query: { limit: 100 } }).then((result) => setProperties(result.properties ?? [])).catch(() => setProperties([])); }, [tenantId]);
 
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("invites", { method: "POST", tenantId, body: { email: form.email, name: form.name, role: "tenant" } });
      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong while adding the tenant");
    } finally { setBusy(false); }
  }
  return <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8"><PageHeader eyebrow="Tenants Registry" title="Add New Tenant" description="Add a tenant and assign them to a property." action={<Link href={`/t/${tenantId}/app/people`} className="text-sm font-semibold text-[#45863b]">Cancel</Link>} /><div className="mx-auto w-full max-w-[760px]">{state === "success" ? <section className="mx-auto max-w-[440px] rounded-[10px] border border-[#dfe7e3] bg-white p-8 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#baff00] text-xl font-bold text-[#004b49]">✓</div><h2 className="mt-5 text-lg font-bold text-[#004b49]">Tenant added successfully!</h2><p className="mt-2 text-sm text-[#71817e]">An invitation has been sent to {form.email}.</p><Button className="mt-6 w-full" onClick={() => router.push(`/t/${tenantId}/app/people`)}>Go to Tenant Registry</Button><Link href={`/t/${tenantId}/app/people/add`} className="mt-3 block text-xs text-[#71817e]">Add Another Tenant</Link></section> : state === "error" ? <section className="mx-auto max-w-[440px] rounded-[10px] border border-[#dfe7e3] bg-white p-8 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] text-[#ff4f4f]">!</div><h2 className="mt-5 text-lg font-bold text-[#004b49]">Failed to Add Tenant</h2><p className="mt-2 text-sm text-[#71817e]">{error}</p><Button className="mt-6 w-full bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => setState("form")}>Try Again</Button><Button variant="secondary" className="mt-3 w-full" onClick={() => setState("form")}>Cancel</Button></section> : <form className="rounded-[10px] border border-[#dfe7e3] bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]" onSubmit={submit}><div className="grid gap-4"><div className="grid gap-3 sm:grid-cols-3"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" required /><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" required /><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" /></div><div className="border-t border-[#edf0ed] pt-4 text-sm font-semibold text-[#24211f]">Lease Details</div><div className="grid gap-3 sm:grid-cols-2"><Select value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })}><option value="">Assign property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</Select><Input value={form.rent} onChange={(event) => setForm({ ...form, rent: event.target.value })} placeholder="Monthly rent" /></div><div className="grid gap-3 sm:grid-cols-2"><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} placeholder="Lease start date" /><Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} placeholder="Lease end date" /></div><div className="border-t border-[#edf0ed] pt-4 text-sm font-semibold text-[#24211f]">Emergency Contact</div><Input placeholder="Emergency contact name and phone" /><div className="flex justify-end gap-3"><Link href={`/t/${tenantId}/app/people`}><Button type="button" variant="secondary">Cancel</Button></Link><Button disabled={busy} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">{busy ? "Adding…" : "Add Tenant"}</Button></div></div></form>}</div></div>;
}
