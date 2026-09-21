"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Role = "tenant" | "landlord" | "letting_agent";

const roleCopy: Record<Role, { title: string; body: string }> = {
  tenant: { title: "Find a better place to call home", body: "Track your tenancy, payments and trust profile in one calm space." },
  landlord: { title: "Look after your property with confidence", body: "Keep properties, tenants and payments clear from the start." },
  letting_agent: { title: "Keep every rental moving", body: "Give landlords and tenants a simple, transparent experience." },
};

export default function OnboardingEntryPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-[#efffee]" />}>
      <OnboardingFlow />
    </React.Suspense>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const tenantId = search.get("tenantId") ?? "";
  const [step, setStep] = React.useState<"role" | "profile">("role");
  const [role, setRole] = React.useState<Role>("tenant");
  const [profile, setProfile] = React.useState({ name: "", phone: "", city: "" });

  function finish(event: React.FormEvent) {
    event.preventDefault();
    if (tenantId) {
      router.push(`/t/${tenantId}/app/${role === "tenant" ? "my-tenancy" : "properties"}`);
      return;
    }
    router.push("/register");
  }

  const copy = roleCopy[role];

  return (
    <AuthShell
      eyebrow={step === "role" ? "Choose your role" : "Personal profile"}
      title={step === "role" ? "How will you use TenantSea?" : copy.title}
      description={step === "role" ? "Choose the experience that fits your rental journey." : copy.body}
    >
      {step === "role" ? (
        <>
          <div className="text-[1.625rem] font-bold tracking-[-0.04em] text-[#0f172a]">Choose your role</div>
          <div className="mt-2 text-sm leading-6 text-muted">You can change this later when your workspace is ready.</div>
          <div className="mt-6 grid gap-3">
            {(Object.keys(roleCopy) as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-[14px] border p-4 text-left transition ${role === item ? "border-[#004b49] bg-[#efffee] ring-2 ring-[#baff00]" : "border-[#dfe7e3] bg-white hover:border-[#9cc8c1]"}`}
              >
                <div className="font-semibold capitalize text-[#0f172a]">{item.replace("_", " ")}</div>
                <div className="mt-1 text-xs leading-5 text-muted">{roleCopy[item].body}</div>
              </button>
            ))}
          </div>
          <Button type="button" className="mt-6 w-full" onClick={() => setStep("profile")}>Continue</Button>
          <Link href="/login" className="mt-4 block text-center text-sm text-muted hover:text-foreground">Back to sign in</Link>
        </>
      ) : (
        <>
          <div className="text-[1.625rem] font-bold tracking-[-0.04em] text-[#0f172a]">Tell us about yourself</div>
          <div className="mt-2 text-sm leading-6 text-muted">A few details help us set up the right workspace.</div>
          <form className="mt-6 grid gap-4" onSubmit={finish}>
            <Field label="Full name"><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Your full name" required /></Field>
            <Field label="Phone number"><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+234 800 000 0000" /></Field>
            <Field label="City"><Input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} placeholder="Lagos" /></Field>
            <Button type="submit" className="mt-2 w-full">Finish setup</Button>
          </form>
          <button type="button" onClick={() => setStep("role")} className="mt-4 block w-full text-center text-sm text-muted hover:text-foreground">Back</button>
        </>
      )}
    </AuthShell>
  );
}