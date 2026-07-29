"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

function VerifyEmailInner() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [state, setState] = React.useState<"verifying" | "ok" | "error">(
    "verifying",
  );
  const [message, setMessage] = React.useState<string>("");

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

  return (
    <div className="card p-6 text-center">
      {state === "verifying" ? (
        <>
          <div className="text-lg font-semibold tracking-tight">
            Verifying your email…
          </div>
          <div className="mt-2 text-sm text-muted">This only takes a moment.</div>
        </>
      ) : state === "ok" ? (
        <>
          <div className="text-lg font-semibold tracking-tight">
            Email verified
          </div>
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
          <div className="text-lg font-semibold tracking-tight">
            Verification failed
          </div>
          <div className="mt-2 text-sm leading-6 text-muted">{message}</div>
          <div className="mt-6">
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
      <React.Suspense fallback={null}>
        <VerifyEmailInner />
      </React.Suspense>
    </div>
  );
}
