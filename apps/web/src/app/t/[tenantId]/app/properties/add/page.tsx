"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const steps = ["Property details", "Amenities & facilities", "Photos & documents"];

type FormState = { title: string; address: string; type: string; bedrooms: string; bathrooms: string; rentAmount: string; currency: string; description: string };

export default function AddPropertyPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({ title: "", address: "", type: "Apartment", bedrooms: "", bathrooms: "", rentAmount: "", currency: "NGN", description: "" });
  const [amenities, setAmenities] = React.useState<string[]>([]);

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function toggleAmenity(value: string) { setAmenities((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await api<{ user: { id: string } }>("auth/me", { tenantId });
      await api("properties", { method: "POST", tenantId, body: { tenantId, title: form.title, address: form.address, landlordId: me.user.id, bedrooms: Number(form.bedrooms), rentAmount: Number(form.rentAmount), currency: form.currency, description: form.description, amenities } });
      setCreated(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong while adding the property");
    } finally { setBusy(false); }
  }

  return <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8"><PageHeader eyebrow="Properties Portfolio" title="Add New Property" description="Add a property to your portfolio in three simple steps." action={<Link href={`/t/${tenantId}/app/properties`} className="text-sm font-semibold text-[#45863b]">Cancel</Link>} /><div className="mx-auto w-full max-w-[760px]"><div className="mb-4 grid grid-cols-3 gap-2">{steps.map((label, index) => <div key={label} className={`border-b-2 pb-2 text-xs font-semibold ${index <= step ? "border-[#baff00] text-[#004b49]" : "border-[#dfe7e3] text-[#71817e]"}`}>{index + 1}. {label}</div>)}</div>{created ? <section className="mx-auto max-w-[440px] rounded-[10px] border border-[#dfe7e3] bg-white p-8 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#baff00] text-xl font-bold text-[#004b49]">✓</div><h2 className="mt-5 text-lg font-bold text-[#004b49]">Property added successfully</h2><p className="mt-2 text-sm text-[#71817e]">Your property has been added to your portfolio.</p><Button className="mt-6 w-full" onClick={() => router.push(`/t/${tenantId}/app/properties`)}>View Property</Button><Link href={`/t/${tenantId}/app/properties/add`} className="mt-3 block text-xs text-[#71817e]">Add Another Property</Link></section> : <form className="rounded-[10px] border border-[#dfe7e3] bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]" onSubmit={submit}>{step === 0 ? <div className="grid gap-4"><Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Property name" required /><Select value={form.type} onChange={(event) => update("type", event.target.value)}><option>Apartment</option><option>House</option><option>Studio</option></Select><Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Street address" required /><Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="City / State" /><div className="grid gap-3 sm:grid-cols-2"><Input type="number" value={form.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="Number of bedrooms" required /><Input type="number" value={form.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} placeholder="Number of bathrooms" /></div><Input type="number" value={form.rentAmount} onChange={(event) => update("rentAmount", event.target.value)} placeholder="Monthly rent" required /><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Property description" className="min-h-24 rounded-[8px] border border-[#dfe7e3] px-3 py-2 text-sm" /></div> : step === 1 ? <div><div className="text-sm font-semibold text-[#24211f]">Amenities & facilities</div><div className="mt-4 grid grid-cols-2 gap-3">{["Parking Space", "Swimming Pool", "Fitness Gym", "24/7 Security", "Power Backup", "Water Supply", "Furnished", "Internet Access"].map((item) => <button type="button" key={item} onClick={() => toggleAmenity(item)} className={`rounded-[8px] border p-3 text-left text-xs ${amenities.includes(item) ? "border-[#9dcc83] bg-[#f2fff0] text-[#45863b]" : "border-[#dfe7e3] text-[#71817e]"}`}>{amenities.includes(item) ? "✓ " : "□ "}{item}</button>)}</div></div> : <div className="grid gap-4"><div className="flex h-32 items-center justify-center rounded-[8px] border border-dashed border-[#a9d6a9] bg-[#f5fff4] text-center text-xs text-[#71817e]">Drag and drop property photos here<br />or click to browse</div><div className="flex h-24 items-center justify-center rounded-[8px] border border-dashed border-[#a9d6a9] bg-[#f5fff4] text-center text-xs text-[#71817e]">Upload lease and legal documents</div></div>}{error ? <div className="mt-4 text-sm text-[#d95c4e]">{error}</div> : null}<div className="mt-6 flex justify-between gap-3">{step > 0 ? <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)}>Back</Button> : <span />}{step < 2 ? <Button type="button" className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]" onClick={() => setStep((value) => value + 1)}>Continue to Step {step + 2}</Button> : <Button disabled={busy} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">{busy ? "Adding…" : "Add Property"}</Button>}</div></form>}</div></div>;
}
