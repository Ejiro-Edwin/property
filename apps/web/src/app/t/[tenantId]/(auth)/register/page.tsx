"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [workspaceName, setWorkspaceName] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("auth/register", {
        method: "POST",
        tenantId,
        body: {
          ...(workspaceName.trim() ? { workspaceName: workspaceName.trim() } : {}),
          name,
          email,
          password,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md pt-10">
        <div className="card p-6">
          <div className="text-lg font-semibold tracking-tight">
            Workspace created — check your inbox
          </div>
          <div className="mt-2 text-sm leading-6 text-muted">
            Your <span className="font-medium text-foreground">{tenantId}</span>{" "}
            workspace is ready and you&apos;re its landlord. We sent a
            verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Verify your email, then sign in and start inviting your tenants and
            agents.
          </div>
          <div className="mt-6">
            <Link href={`/t/${tenantId}/login`}>
              <Button className="w-full">Go to sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">
          Create your workspace
        </div>
        <div className="mt-1 text-sm leading-6 text-muted">
          You&apos;ll be the landlord of{" "}
          <span className="font-medium text-foreground">{tenantId}</span>. Once
          you&apos;re in, invite your tenants and agents — they join through
          email invitations, not this form.
        </div>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <Field label="Workspace name" hint="Optional display name.">
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Properties Ltd"
            />
          </Field>
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
            {busy ? "Creating workspace…" : "Create workspace"}
          </Button>

          <div className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href={`/t/${tenantId}/login`}
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
