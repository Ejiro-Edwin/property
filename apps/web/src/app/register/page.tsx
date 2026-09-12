"use client";

import * as React from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [createdTenantId, setCreatedTenantId] = React.useState("");
  const [resendBusy, setResendBusy] = React.useState(false);
  const [resendNotice, setResendNotice] = React.useState<string | null>(null);

  async function resendVerification() {
    setResendBusy(true);
    setResendNotice(null);
    try {
      const res = await api<{ message?: string }>("auth/resend-verification", {
        method: "POST",
        body: { email, ...(createdTenantId ? { tenantId: createdTenantId } : {}) },
      });
      setResendNotice(res?.message ?? "Verification email sent");
    } catch (err) {
      setResendNotice(
        err instanceof ApiError ? err.message : "Could not resend verification email",
      );
    } finally {
      setResendBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{
        tenant?: { id: string };
      }>("auth/register", {
        method: "POST",
        body: {
          ...(workspaceName.trim() ? { workspaceName: workspaceName.trim() } : {}),
          name,
          email,
          password,
        },
      });
      setCreatedTenantId(res.tenant?.id ?? "");
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="You&apos;re almost there" title="Secure, digital and transparent." description="One account for your properties, people and payments.">
        <div className="text-lg font-semibold tracking-tight">
          Account created — check your inbox
        </div>
        <div className="mt-2 text-sm leading-6 text-muted">
          You&apos;re set up as a landlord. We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Verify
          your email, then sign in and invite tenants and agents.
        </div>
        <div className="mt-6 grid gap-3">
          <Link href="/login">
            <Button className="w-full">Go to sign in</Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={resendBusy}
            onClick={resendVerification}
          >
            {resendBusy ? "Sending…" : "Resend verification email"}
          </Button>
          {resendNotice ? (
            <div className="text-center text-sm text-muted">{resendNotice}</div>
          ) : null}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Create your account" title="Secure, digital and transparent." description="Set up your workspace and bring your rental operations into one place.">
      <div className="text-lg font-semibold tracking-tight">Create your account</div>
      <div className="mt-1 text-sm leading-6 text-muted">
        Sign up as a landlord. Tenants and agents join through email
        invitations — not this form.
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <Field label="Your full name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field
          label="Company or portfolio name"
          hint="Optional — helps name your workspace."
        >
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Properties Ltd"
            autoComplete="organization"
          />
        </Field>
        <Field label="Password" hint="Use at least 8 characters.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>

        {error ? <div className="text-sm text-danger">{error}</div> : null}

        <Button disabled={busy} type="submit">
          {busy ? "Creating account…" : "Create account"}
        </Button>

        <div className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
