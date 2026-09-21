"use client";

import * as React from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell variant="centered" eyebrow="Forgot password" title="Get back to your account." description="We&apos;ll help you reset your password securely.">
      <div className="mx-auto w-full max-w-md">
        <div className="text-lg font-semibold tracking-tight">Reset your password</div>
        <div className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </div>

        {sent ? (
          <div className="mt-6 grid gap-4">
            <div className="rounded-[12px] bg-brand-soft px-4 py-3 text-sm leading-6 text-brand-ink">
              If an account exists for{" "}
              <span className="font-medium">{email}</span>, a password reset link is
              on its way.
            </div>
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
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

            {error ? <div className="text-sm text-danger">{error}</div> : null}

            <Button disabled={busy} type="submit">
              {busy ? "Sending…" : "Send reset link"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-muted hover:text-foreground">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
