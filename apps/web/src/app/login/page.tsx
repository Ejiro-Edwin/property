"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

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
  const [errorKind, setErrorKind] = React.useState<"unverified" | "suspended" | "network" | null>(null);
  const [signedIn, setSignedIn] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrorKind(null);
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
      setSignedIn(true);
      window.setTimeout(() => router.replace(target), 650);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      const normalized = message.toLowerCase();
      setErrorKind(
        normalized.includes("verify") || normalized.includes("verified")
          ? "unverified"
          : normalized.includes("suspend") || normalized.includes("disabled")
            ? "suspended"
            : normalized.includes("network") || normalized.includes("fetch")
              ? "network"
              : null,
      );
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Everything you need for a better rental experience." description="Sign in to manage your rental journey with clarity.">
      {signedIn ? (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal border-t-transparent animate-spin" />
          <div className="mt-6 text-2xl font-bold tracking-tight text-teal">Welcome back.</div>
          <div className="mt-2 text-sm text-muted">Taking you to your workspace…</div>
        </div>
      ) : (
        <>
          <div className="mb-2 text-lg font-semibold tracking-tight">Sign in</div>
          <div className="text-sm text-muted">
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

            {error ? (
              <div className="rounded-[12px] border border-danger/20 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">
                <div className="font-semibold">
                  {errorKind === "unverified" ? "Verify your account" : errorKind === "suspended" ? "Account unavailable" : errorKind === "network" ? "Something went wrong" : "Unable to sign in"}
                </div>
                <div className="mt-1">{error}</div>
                {errorKind === "unverified" ? <Link href="/verify-email" className="mt-2 inline-block font-semibold underline">Resend verification email</Link> : null}
                {errorKind === "suspended" ? <Link href="/forgot-password" className="mt-2 inline-block font-semibold underline">Contact support</Link> : null}
                {errorKind === "network" ? <button type="button" className="mt-2 block font-semibold underline" onClick={() => setError(null)}>Try again</button> : null}
              </div>
            ) : null}

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
        </>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="mx-auto max-w-md pt-10 text-sm text-muted">Loading…</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
