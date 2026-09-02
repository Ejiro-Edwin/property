"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

function ResetPasswordForm() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const tenantId = search.get("tenantId") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("auth/reset-password", {
        method: "POST",
        body: { token, password, ...(tenantId ? { tenantId } : {}) },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="p-1">
        <div className="text-lg font-semibold tracking-tight">Invalid link</div>
        <div className="mt-2 text-sm leading-6 text-muted">
          This reset link is missing its token. Request a new one from the
          forgot-password page.
        </div>
        <div className="mt-6">
          <Link href="/forgot-password">
            <Button variant="secondary" className="w-full">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-1">
        <div className="text-lg font-semibold tracking-tight">Password updated</div>
        <div className="mt-2 text-sm leading-6 text-muted">
          Your password has been reset. You can sign in with your new password now.
        </div>
        <div className="mt-6">
          <Link href="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="text-lg font-semibold tracking-tight">Choose a new password</div>
      <div className="mt-1 text-sm text-muted">Set a new password for your account.</div>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <Field label="New password" hint="Use at least 8 characters.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
          />
        </Field>

        {error ? <div className="text-sm text-danger">{error}</div> : null}

        <Button disabled={busy} type="submit">
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Reset password" title="Create a new password." description="Choose a strong password to keep your account secure.">
      <React.Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <ResetPasswordForm />
      </React.Suspense>
    </AuthShell>
  );
}
