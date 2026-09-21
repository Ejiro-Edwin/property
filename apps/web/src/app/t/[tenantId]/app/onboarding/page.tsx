"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const steps = ["agent", "property", "trust", "notifications", "complete", "tour"] as const;
type Step = (typeof steps)[number];

const copy: Record<Step, { eyebrow: string; title: string; description: string }> = {
  agent: { eyebrow: "01 / 06", title: "Set up your agency profile", description: "Tell us a little about your agency." },
  property: { eyebrow: "02 / 06", title: "Add your first property", description: "Start building your rental portfolio." },
  trust: { eyebrow: "03 / 06", title: "Build your trusted rental profile", description: "Give tenants and partners confidence from day one." },
  notifications: { eyebrow: "04 / 06", title: "Stay up to date", description: "Choose which updates matter to you." },
  complete: { eyebrow: "05 / 06", title: "You're all set!", description: "Your TenantSea workspace is ready to go." },
  tour: { eyebrow: "06 / 06", title: "Welcome to your dashboard", description: "A quick look around before you get started." },
};

export default function OnboardingPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [index, setIndex] = React.useState(0);
  const [agent, setAgent] = React.useState({ name: "", agency: "", phone: "", email: "" });
  const [property, setProperty] = React.useState({ title: "", address: "", city: "", type: "Apartment", bedrooms: "", bathrooms: "" });
  const [notifications, setNotifications] = React.useState({ payments: true, messages: true, maintenance: true, updates: false });
  const step = steps[index];
  const current = copy[step];

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-[#efffee] px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-[650px] flex-col items-center">
        <div className="mb-6 flex w-full items-center justify-between text-xs text-[#52706d]"><span className="font-bold tracking-[-0.02em] text-[#004b49]">TenantSea</span><span>{current.eyebrow}</span></div>
        <div className="mb-6 grid w-full grid-cols-6 gap-1.5" aria-label="Onboarding progress">{steps.map((item, itemIndex) => <div key={item} className={`h-1.5 rounded-full ${itemIndex <= index ? "bg-[#baff00]" : "bg-[#cfe9cf]"}`} />)}</div>
        <section className="w-full rounded-[8px] border border-[#d9efd9] bg-white p-6 shadow-[0_14px_40px_rgba(0,75,73,0.08)] sm:p-9">
          <div className="mx-auto max-w-[390px]">
            <div className="mb-7 flex items-center justify-center"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efffee] text-[#004b49]">{step === "complete" ? "✓" : "•"}</div></div>
            <div className="text-center"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#52706d]">{current.eyebrow}</div><h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-[#004b49] sm:text-[30px]">{current.title}</h1><p className="mt-2 text-sm leading-6 text-[#6c7977]">{current.description}</p></div>
            {step === "agent" ? <AgentForm value={agent} onChange={setAgent} /> : null}
            {step === "property" ? <PropertyForm value={property} onChange={setProperty} /> : null}
            {step === "trust" ? <TrustProfile /> : null}
            {step === "notifications" ? <NotificationPreferences value={notifications} onChange={setNotifications} /> : null}
            {step === "complete" ? <CompleteSummary /> : null}
            {step === "tour" ? <DashboardTour /> : null}
            <div className="mt-8 flex gap-3">{index > 0 ? <Button type="button" variant="secondary" onClick={() => setIndex((value) => value - 1)}>Back</Button> : null}{step === "tour" ? <Link className="flex-1" href={`/t/${tenantId}/app`}><Button className="w-full">Explore TenantSea</Button></Link> : <Button type="button" className="flex-1" onClick={() => setIndex((value) => Math.min(value + 1, steps.length - 1))}>Continue</Button>}</div>
            {step !== "tour" ? <button type="button" onClick={() => setIndex(steps.length - 1)} className="mt-4 block w-full text-center text-xs text-[#71817e] hover:text-[#004b49]">Skip for now</button> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function AgentForm({ value, onChange }: { value: { name: string; agency: string; phone: string; email: string }; onChange: (value: { name: string; agency: string; phone: string; email: string }) => void }) {
  return <div className="mt-7 grid gap-3"><Field label="Full name"><Input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="Your full name" /></Field><Field label="Agency name"><Input value={value.agency} onChange={(event) => onChange({ ...value, agency: event.target.value })} placeholder="Your agency" /></Field><Field label="Phone number"><Input value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} placeholder="+234 800 000 0000" /></Field><Field label="Email address"><Input type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} placeholder="you@example.com" /></Field></div>;
}

function PropertyForm({ value, onChange }: { value: { title: string; address: string; city: string; type: string; bedrooms: string; bathrooms: string }; onChange: (value: { title: string; address: string; city: string; type: string; bedrooms: string; bathrooms: string }) => void }) {
  return <div className="mt-7 grid gap-3"><div className="flex h-20 items-center justify-center rounded-[8px] border border-dashed border-[#a9d6a9] bg-[#f5fff4] text-xs text-[#71817e]">+ Upload property photo</div><Field label="Property title"><Input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="e.g. Marina Crescent" /></Field><Field label="Street address"><Input value={value.address} onChange={(event) => onChange({ ...value, address: event.target.value })} placeholder="Property address" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="City"><Input value={value.city} onChange={(event) => onChange({ ...value, city: event.target.value })} placeholder="Lagos" /></Field><Field label="Property type"><Input value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value })} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Bedrooms"><Input type="number" value={value.bedrooms} onChange={(event) => onChange({ ...value, bedrooms: event.target.value })} placeholder="3" /></Field><Field label="Bathrooms"><Input type="number" value={value.bathrooms} onChange={(event) => onChange({ ...value, bathrooms: event.target.value })} placeholder="2" /></Field></div></div>;
}

function TrustProfile() {
  return <div className="mt-7 grid gap-2 rounded-[8px] border border-[#d9efd9] bg-[#f7fff6] p-4 text-sm"><div className="flex justify-between"><span>Payment history</span><span className="font-semibold text-[#16a34a]">Getting started</span></div><div className="flex justify-between"><span>Tenancy history</span><span className="font-semibold text-[#16a34a]">Getting started</span></div><div className="flex justify-between"><span>Profile completeness</span><span className="font-semibold text-[#16a34a]">In progress</span></div><div className="mt-2 border-t border-[#d9efd9] pt-3 text-xs text-[#71817e]">Your trust profile grows with verified rental activity.</div></div>;
}

function NotificationPreferences({ value, onChange }: { value: { payments: boolean; messages: boolean; maintenance: boolean; updates: boolean }; onChange: (value: { payments: boolean; messages: boolean; maintenance: boolean; updates: boolean }) => void }) {
  return <div className="mt-7 grid gap-2">{Object.entries(value).map(([key, active]) => <button key={key} type="button" onClick={() => onChange({ ...value, [key]: !active })} className="flex items-center justify-between rounded-[8px] border border-[#d9efd9] px-4 py-3 text-left text-sm"><span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span><span className={`relative inline-flex h-5 w-9 items-center rounded-full ${active ? "bg-[#baff00]" : "bg-[#dbe5dc]"}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} /></span></button>)}</div>;
}

function CompleteSummary() {
  return <div className="mt-7 rounded-[8px] border border-[#d9efd9] bg-[#f7fff6] p-4 text-sm"><div className="flex justify-between py-2"><span>Workspace profile</span><span className="font-semibold text-[#16a34a]">Complete</span></div><div className="flex justify-between border-t border-[#d9efd9] py-2"><span>Property setup</span><span className="font-semibold text-[#16a34a]">Complete</span></div><div className="flex justify-between border-t border-[#d9efd9] py-2"><span>Notifications</span><span className="font-semibold text-[#16a34a]">Configured</span></div></div>;
}

function DashboardTour() {
  return <div className="mt-7 rounded-[8px] border border-[#d9efd9] bg-[#f7fff6] p-4 text-sm"><div className="font-semibold text-[#004b49]">Your workspace is ready</div><div className="mt-3 grid gap-2 text-xs text-[#71817e]"><div className="rounded-[6px] bg-white p-3">Manage your properties and tenancies</div><div className="rounded-[6px] bg-white p-3">Track payments and trust activity</div><div className="rounded-[6px] bg-white p-3">Stay on top of notifications</div></div></div>;
}
