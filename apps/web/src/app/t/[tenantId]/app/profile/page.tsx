"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Me = {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string | null;
  emailVerified?: boolean;
};

function roleTone(role: string) {
  switch (role.toLowerCase()) {
    case "landlord":
      return "brand" as const;
    case "letting_agent":
      return "sand" as const;
    case "admin":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export default function ProfilePage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [me, setMe] = React.useState<Me | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", phone: "" });

  React.useEffect(() => {
    api<{ user: Me }>("auth/me", { tenantId })
      .then((r) => {
        setMe(r.user);
        setForm({ name: r.user.name ?? "", phone: r.user.phone ?? "" });
      })
      .catch(() => setMe(null));
  }, [tenantId]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`users/${me.id}`, {
        method: "PATCH",
        tenantId,
        query: { tenantId },
        body: { tenantId, name: form.name, phone: form.phone },
      });
      setMe((prev) => (prev ? { ...prev, name: form.name, phone: form.phone } : prev));
      setNotice("Profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update profile");
    } finally {
      setBusy(false);
    }
  }

  const logoutAction = `/api/auth/logout?redirect=${encodeURIComponent("/login")}`;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 pb-8">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your account in this workspace."
      />

      {me ? (
        <div className="card rounded-[20px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#efffee] text-xl font-semibold text-[#004b49]">
              {me.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold tracking-tight text-[#0f172a]">{me.name}</div>
              <div className="mt-0.5 truncate text-sm text-slate-600">{me.email}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {me.role ? (
                  <Badge tone={roleTone(me.role)} className="capitalize">
                    {me.role.replaceAll("_", " ").toLowerCase()}
                  </Badge>
                ) : null}
                {me.emailVerified === false ? (
                  <Badge tone="warning">Email unverified</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={saveProfile}>
            <Field label="Full name">
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </Field>
            <Field label="Email">
              <Input value={me.email} disabled />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </Field>

            {error ? <div className="text-sm text-danger">{error}</div> : null}
            {notice ? <div className="text-sm text-success">{notice}</div> : null}

            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <form action={logoutAction} method="post" className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100">
              Sign out
            </Button>
          </form>
        </div>
      ) : (
        <div className="card rounded-[22px] p-6 text-sm text-slate-600">
          Could not load your profile. Try signing in again.
        </div>
      )}
    </div>
  );
}
