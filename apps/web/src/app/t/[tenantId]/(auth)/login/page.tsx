"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Login failed");
      router.push(`/t/${tenantId}/app`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">Sign in</div>
        <div className="mt-1 text-sm text-muted">
          Use your email + password to access your workspace.
        </div>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </Field>

          {error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : null}

          <Button disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link
              href={`/t/${tenantId}/forgot-password`}
              className="text-muted hover:text-foreground"
            >
              Forgot password
            </Link>
            <Link
              href={`/t/${tenantId}/register`}
              className="text-muted hover:text-foreground"
            >
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

