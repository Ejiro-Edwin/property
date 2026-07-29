"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type InvitePreview = {
  tenantId: string;
  workspaceName: string;
  email: string;
  name: string | null;
  role: string;
  expiresAt: string;
};

function AcceptInviteInner() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [preview, setPreview] = React.useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setPreviewError("This invite link is missing its token.");
      return;
    }
    let cancelled = false;
    api<InvitePreview>("invites/preview", { query: { token } })
      .then((p) => {
        if (cancelled) return;
        setPreview(p);
        if (p.name) setName(p.name);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewError(
            err instanceof ApiError
              ? err.message
              : "This invitation could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("invites/accept", {
        method: "POST",
        body: { token, name, password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept invitation");
    } finally {
      setBusy(false);
    }
  }

  if (previewError) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">
          Invitation unavailable
        </div>
        <div className="mt-2 text-sm leading-6 text-muted">{previewError}</div>
        <div className="mt-2 text-sm leading-6 text-muted">
          Ask the person who invited you to send a new invitation.
        </div>
      </div>
    );
  }

  if (done && preview) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">
          You&apos;re in
        </div>
        <div className="mt-2 text-sm leading-6 text-muted">
          Your account in{" "}
          <span className="font-medium text-foreground">{preview.workspaceName}</span>{" "}
          is ready. Sign in with your email and new password.
        </div>
        <div className="mt-6">
          <Link href={`/t/${preview.tenantId}/login`}>
            <Button className="w-full">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="card p-6 text-center text-sm text-muted">
        Loading your invitation…
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="text-lg font-semibold tracking-tight">
        Join {preview.workspaceName}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>
          You&apos;ve been invited as{" "}
          <Badge tone="brand" className="align-middle capitalize">
            {preview.role.replaceAll("_", " ")}
          </Badge>
        </span>
      </div>
      <div className="mt-1 text-sm text-muted">
        Signing up as{" "}
        <span className="font-medium text-foreground">{preview.email}</span>
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
        <Field label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
        </Field>

        {error ? <div className="text-sm text-danger">{error}</div> : null}

        <Button disabled={busy} type="submit">
          {busy ? "Joining…" : "Accept invitation"}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <React.Suspense fallback={null}>
        <AcceptInviteInner />
      </React.Suspense>
    </div>
  );
}
