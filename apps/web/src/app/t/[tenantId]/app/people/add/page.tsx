"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Property = { id: string; title: string; rentAmount: number; currency: string };

type TenantForm = {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  rent: string;
  startDate: string;
  endDate: string;
  emergencyName: string;
  emergencyPhone: string;
  password: string;
};

export default function AddTenantPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [state, setState] = React.useState<"form" | "success" | "error">("form");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null);
  const [landlordId, setLandlordId] = React.useState("");
  const [form, setForm] = React.useState<TenantForm>({ name: "", email: "", phone: "", propertyId: "", rent: "", startDate: "", endDate: "", emergencyName: "", emergencyPhone: "", password: "" });

  React.useEffect(() => {
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 100 } })
      .then((result) => setProperties(result.properties ?? []))
      .catch(() => setProperties([]));
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((result) => setLandlordId(result.user.id))
      .catch(() => setLandlordId(""));
  }, [tenantId]);

  function update(key: keyof TenantForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!landlordId) throw new Error("Your session has expired. Please sign in again.");
      const created = await api<{ user: { id: string } }>("users", {
        method: "POST",
        tenantId,
        body: { tenantId, name: form.name, email: form.email, password: form.password, role: "tenant", phone: form.phone || undefined },
      });
      const selectedProperty = properties.find((property) => property.id === form.propertyId);
      if (selectedProperty) {
        await api("tenancies", {
          method: "POST",
          tenantId,
          body: {
            tenantId,
            propertyId: selectedProperty.id,
            tenantUserId: created.user.id,
            landlordId,
            rentAmount: Number(form.rent || selectedProperty.rentAmount),
            currency: selectedProperty.currency || "NGN",
            startDate: form.startDate || new Date().toISOString().slice(0, 10),
            ...(form.endDate ? { endDate: form.endDate } : {}),
            status: "active",
          },
        });
      }
      setCredentials({ email: form.email, password: form.password });
      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong while adding the tenant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <PageHeader eyebrow="Tenants Registry" title="Add New Tenant" description="Add a tenant and assign them to a property." action={<Link href={`/t/${tenantId}/app/people`} className="text-sm font-semibold text-[#24211f]">Cancel</Link>} />
      {state === "success" ? (
        <section className="mx-auto w-full max-w-[440px] rounded-[8px] border border-[#dfe7e3] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#baff00] text-xl font-bold text-[#004b49]">✓</div>
          <h2 className="mt-5 text-lg font-bold text-[#004b49]">Tenant Added Successfully!</h2>
          <p className="mt-2 text-sm text-[#71817e]">The tenant account is active and can sign in immediately.</p>
          {credentials ? <div className="mt-5 grid gap-2 rounded-[8px] border border-[#dfe7e3] bg-[#f8faf9] p-4 text-left text-sm"><div><span className="text-[#71817e]">Login email</span><div className="font-semibold text-[#24211f]">{credentials.email}</div></div><div><span className="text-[#71817e]">Initial password</span><div className="font-semibold text-[#24211f]">{credentials.password}</div></div><p className="text-xs text-[#71817e]">Share these credentials securely and ask the tenant to change the password in Settings after signing in.</p></div> : null}
          <Button className="mt-6 w-full" onClick={() => router.push(`/t/${tenantId}/app/people`)}>Go to Tenant Registry</Button>
          <Link href={`/t/${tenantId}/app/people/add`} className="mt-3 block text-xs text-[#71817e]">Add Another Tenant</Link>
        </section>
      ) : state === "error" ? (
        <section className="mx-auto w-full max-w-[440px] rounded-[8px] border border-[#dfe7e3] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] text-[#ff4f4f]">!</div>
          <h2 className="mt-5 text-lg font-bold text-[#004b49]">Failed to Add Tenant</h2>
          <p className="mt-2 text-sm text-[#71817e]">{error}</p>
          <Button className="mt-6 w-full" onClick={() => setState("form")}>Try Again</Button>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setState("form")}>Cancel</Button>
        </section>
      ) : (
        <form onSubmit={submit} className="mx-auto grid w-full max-w-[840px] gap-6 rounded-[8px] border border-[#dfe7e3] bg-white p-6 sm:p-8">
          <section className="grid gap-4">
            <h2 className="text-sm font-bold text-[#24211f]">Personal Information</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Full name<Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Sarah Johnson" required /></label>
              <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Email address<Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="sarah@example.com" required /></label>
              <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Phone number<Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+234 800 000 0000" /></label>
              <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Initial password<Input type="password" minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters" required /></label>
            </div>
          </section>
          <section className="grid gap-4 border-t border-[#edf0ed] pt-5">
            <h2 className="text-sm font-bold text-[#24211f]">Lease Details</h2>
            <div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Property<Select value={form.propertyId} onChange={(event) => update("propertyId", event.target.value)}><option value="">Select property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</Select></label><label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Monthly rent<Input type="number" value={form.rent} onChange={(event) => update("rent", event.target.value)} placeholder="₦250,000" /></label><label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Tenant status<Select value="ACTIVE" disabled><option value="ACTIVE">Active</option></Select></label></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Lease start date<Input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} /></label><label className="grid gap-1.5 text-[11px] font-semibold text-[#52605c]">Lease end date<Input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} /></label></div>
          </section>
          <section className="grid gap-4 border-t border-[#edf0ed] pt-5"><h2 className="text-sm font-bold text-[#24211f]">Emergency Contact</h2><div className="grid gap-3 sm:grid-cols-2"><Input value={form.emergencyName} onChange={(event) => update("emergencyName", event.target.value)} placeholder="e.g. Robert Johnson" /><Input value={form.emergencyPhone} onChange={(event) => update("emergencyPhone", event.target.value)} placeholder="+234 800 000 0000" /></div></section>
          {error ? <div className="text-sm text-[#d95c4e]">{error}</div> : null}
          <div className="flex justify-end gap-3"><Link href={`/t/${tenantId}/app/people`}><Button type="button" variant="secondary">Cancel</Button></Link><Button disabled={busy}>{busy ? "Adding…" : "Add Tenant"}</Button></div>
        </form>
      )}
    </div>
  );
}
