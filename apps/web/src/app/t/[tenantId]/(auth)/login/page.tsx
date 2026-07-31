"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const searchParams = useSearchParams();
  const tenantId = params.tenantId;
  const nextPath = searchParams.get("next");

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
      const target =
        nextPath && nextPath.startsWith(`/t/${tenantId}/`)
          ? nextPath
          : `/t/${tenantId}/app`;
      router.replace(target);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
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
          Workspace: <span className="font-medium text-foreground">{tenantId}</span>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </Field>

          {error ? <div className="text-sm text-danger">{error}</div> : null}

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
            <Link href="/register" className="text-muted hover:text-foreground">
              New workspace
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="mx-auto max-w-md pt-10 text-sm text-muted">Loading…</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
