"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const steps = ["property", "trust", "notifications", "complete"] as const;
type Step = (typeof steps)[number];

const stepCopy: Record<Step, { label: string; title: string; description: string }> = {
  property: { label: "01", title: "Add your first property", description: "Start building your rental portfolio." },
  trust: { label: "02", title: "Build your trusted rental profile", description: "Give tenants and partners confidence from day one." },
  notifications: { label: "03", title: "Stay up to date", description: "Choose which updates matter to you." },
  complete: { label: "04", title: "You're all set!", description: "Your TenantSea workspace is ready to go." },
};

export default function OnboardingPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [property, setProperty] = React.useState({ title: "", address: "", city: "", bedrooms: "" });
  const [notifications, setNotifications] = React.useState({ payments: true, messages: true, updates: false });
  const step = steps[stepIndex];
  const copy = stepCopy[step];

  function next() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 py-4 lg:grid-cols-[0.7fr_1fr] lg:items-center lg:py-12">
        <div className="hidden lg:block">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-lime">Getting started</div>
          <h1 className="mt-5 max-w-sm text-5xl font-black leading-[0.98] tracking-[-0.04em] text-teal">Set up your workspace in a few simple steps.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted">A clear starting point for your properties, trust profile and important updates.</p>
        </div>

        <div className="auth-form mx-auto w-full max-w-lg rounded-[4px] border border-border p-6 shadow-[0_18px_50px_rgba(0,75,73,0.08)] sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{copy.label} / 04</span>
            <span className="text-xs text-muted">{step === "complete" ? "Complete" : "Onboarding"}</span>
          </div>
          <div className="mb-8 grid grid-cols-4 gap-2" aria-label="Onboarding progress">
            {steps.map((item, index) => <div key={item} className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-[var(--auth-lime)]" : "bg-black/10"}`} />)}
          </div>

          {step === "property" ? (
            <>
              <StepHeading title={copy.title} description={copy.description} />
              <div className="mt-8 grid gap-4">
                <div className="flex min-h-28 items-center justify-center rounded-[4px] border border-dashed border-teal/30 bg-[var(--auth-mint)] text-center text-xs text-muted">Add a property photo<br />Optional</div>
                <Field label="Property title"><Input value={property.title} onChange={(event) => setProperty({ ...property, title: event.target.value })} placeholder="e.g. Marina Crescent" /></Field>
                <Field label="Address"><Input value={property.address} onChange={(event) => setProperty({ ...property, address: event.target.value })} placeholder="Street address" /></Field>
                <div className="grid gap-4 sm:grid-cols-2"><Field label="City"><Input value={property.city} onChange={(event) => setProperty({ ...property, city: event.target.value })} placeholder="Lagos" /></Field><Field label="Bedrooms"><Input type="number" min="0" value={property.bedrooms} onChange={(event) => setProperty({ ...property, bedrooms: event.target.value })} placeholder="3" /></Field></div>
              </div>
            </>
          ) : null}

          {step === "trust" ? (
            <>
              <StepHeading title={copy.title} description={copy.description} />
              <div className="mt-8 grid gap-3"><TrustRow label="Payment history" value="Build your record over time" /><TrustRow label="Tenancy history" value="Add verified experience" /><TrustRow label="Profile completeness" value="Keep your details current" /></div>
            </>
          ) : null}

          {step === "notifications" ? (
            <>
              <StepHeading title={copy.title} description={copy.description} />
              <div className="mt-8 grid gap-3"><Toggle label="Payment reminders" checked={notifications.payments} onChange={() => setNotifications({ ...notifications, payments: !notifications.payments })} /><Toggle label="Messages and invitations" checked={notifications.messages} onChange={() => setNotifications({ ...notifications, messages: !notifications.messages })} /><Toggle label="Product updates" checked={notifications.updates} onChange={() => setNotifications({ ...notifications, updates: !notifications.updates })} /></div>
            </>
          ) : null}

          {step === "complete" ? (
            <>
              <StepHeading title={copy.title} description={copy.description} />
              <div className="mt-8 grid gap-3 rounded-[4px] bg-[var(--auth-mint)] p-4 text-sm"><div className="flex justify-between"><span className="text-muted">Workspace profile</span><span className="font-semibold text-success">Complete</span></div><div className="flex justify-between"><span className="text-muted">Notifications</span><span className="font-semibold text-success">Configured</span></div></div>
            </>
          ) : null}

          <div className="mt-8 flex gap-3">
            {stepIndex > 0 ? <Button variant="secondary" onClick={() => setStepIndex((current) => current - 1)}>Back</Button> : null}
            {step === "complete" ? <Link className="flex-1" href={`/t/${tenantId}/app`}><Button className="w-full bg-[var(--auth-lime)] text-teal hover:bg-[#a9eb00]">Go to dashboard</Button></Link> : <Button className="flex-1 bg-[var(--auth-lime)] text-teal hover:bg-[#a9eb00]" onClick={next}>Continue</Button>}
          </div>
          {step !== "complete" ? <Link href={`/t/${tenantId}/app`} className="mt-4 block text-center text-xs text-muted hover:text-foreground">Skip for now</Link> : null}
        </div>
      </div>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-2xl font-bold tracking-tight text-teal">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>;
}

function TrustRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[4px] border border-border p-4"><div className="flex justify-between gap-4 text-sm font-semibold"><span>{label}</span><span className="text-xs font-bold text-success">In progress</span></div><div className="mt-1 text-xs text-muted">{value}</div></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button type="button" onClick={onChange} className="flex items-center justify-between rounded-[4px] border border-border p-4 text-left text-sm font-medium"><span>{label}</span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${checked ? "bg-[var(--auth-lime)]" : "bg-black/15"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} /></span></button>;
}
