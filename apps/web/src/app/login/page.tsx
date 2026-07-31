"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [workspace, setWorkspace] = React.useState(searchParams.get("workspace") ?? "");
  const [needsWorkspace, setNeedsWorkspace] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string> = { email, password };
      if (workspace.trim()) body.tenantId = workspace.trim();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data?.message ??
          data?.error ??
          (data?.data as { message?: string } | undefined)?.message ??
          "Login failed";
        if (
          typeof message === "string" &&
          message.toLowerCase().includes("multiple accounts")
        ) {
          setNeedsWorkspace(true);
        }
        throw new Error(Array.isArray(message) ? message.join(", ") : message);
      }

      const tenantId = data?.user?.tenantId as string | undefined;
      if (!tenantId) throw new Error("Login succeeded but workspace was not returned");

      const target =
        nextPath && nextPath.startsWith(`/t/${tenantId}/`) ? nextPath : `/t/${tenantId}/app`;
      router.replace(target);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">Sign in</div>
        <div className="mt-1 text-sm text-muted">
          Use your email and password. We&apos;ll take you to your workspace.
        </div>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
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

          {needsWorkspace ? (
            <Field
              label="Workspace"
              hint="This email belongs to more than one workspace. Enter which one to use."
            >
              <Input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="e.g. thelinx"
                required
              />
            </Field>
          ) : null}

          {error ? <div className="text-sm text-danger">{error}</div> : null}

          <Button disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-muted hover:text-foreground">
              Forgot password
            </Link>
            <Link href="/register" className="text-muted hover:text-foreground">
              Sign up
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
