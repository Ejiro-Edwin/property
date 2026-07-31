"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function VerifyEmailInner() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [state, setState] = React.useState<"verifying" | "ok" | "error">("verifying");
  const [message, setMessage] = React.useState<string>("");
  const [resendEmail, setResendEmail] = React.useState("");
  const [resendBusy, setResendBusy] = React.useState(false);
  const [resendNotice, setResendNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    let cancelled = false;
    api("auth/verify-email", { method: "POST", tenantId, body: { token } })
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch((err) => {
        if (!cancelled) {
          setState("error");
          setMessage(
            err instanceof ApiError
              ? err.message
              : "Verification failed. The link may have expired.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, tenantId]);

  async function resendVerification(e: React.FormEvent) {
    e.preventDefault();
    setResendBusy(true);
    setResendNotice(null);
    try {
      const res = await api<{ message?: string }>("auth/resend-verification", {
        method: "POST",
        tenantId,
        body: { email: resendEmail, tenantId },
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

  return (
    <div className="card p-6 text-center">
      {state === "verifying" ? (
        <>
          <div className="text-lg font-semibold tracking-tight">Verifying your email…</div>
          <div className="mt-2 text-sm text-muted">This only takes a moment.</div>
        </>
      ) : state === "ok" ? (
        <>
          <div className="text-lg font-semibold tracking-tight">Email verified</div>
          <div className="mt-2 text-sm leading-6 text-muted">
            You&apos;re all set. Sign in to access your workspace.
          </div>
          <div className="mt-6">
            <Link href={`/t/${tenantId}/login`}>
              <Button className="w-full">Sign in</Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="text-lg font-semibold tracking-tight">Verification failed</div>
          <div className="mt-2 text-sm leading-6 text-muted">{message}</div>
          <form className="mt-6 grid gap-3 text-left" onSubmit={resendVerification}>
            <Field label="Your email">
              <Input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </Field>
            <Button type="submit" disabled={resendBusy}>
              {resendBusy ? "Sending…" : "Resend verification email"}
            </Button>
            {resendNotice ? <div className="text-sm text-muted">{resendNotice}</div> : null}
          </form>
          <div className="mt-4">
            <Link href={`/t/${tenantId}/login`}>
              <Button variant="secondary" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <React.Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <VerifyEmailInner />
      </React.Suspense>
    </div>
  );
}
