"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

const inviteRoles = [
  { value: "tenant", label: "Tenant" },
  { value: "letting_agent", label: "Agent" },
  { value: "landlord", label: "Landlord" },
];

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

export default function PeoplePage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [invites, setInvites] = React.useState<Invite[] | null>(null);
  const [canInvite, setCanInvite] = React.useState(true);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("tenant");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const memberCount = members?.length ?? 0;
  const verifiedCount = members?.filter((m) => m.emailVerified).length ?? 0;
  const inviteCount = invites?.length ?? 0;

  const loadInvites = React.useCallback(() => {
    api<{ invitations: Invite[] }>("invites", { tenantId })
      .then((r) => setInvites(r.invitations ?? []))
      .catch((err) => {
        setInvites([]);
        if (err instanceof ApiError && err.status === 403) setCanInvite(false);
      });
  }, [tenantId]);

  React.useEffect(() => {
    api<{ users: Member[] }>("users", { tenantId, query: { limit: 50 } })
      .then((r) => setMembers(r.users ?? []))
      .catch(() => setMembers([]));
    loadInvites();
  }, [tenantId, loadInvites]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api<{ message?: string }>("invites", {
        method: "POST",
        tenantId,
        body: { email, ...(name.trim() ? { name: name.trim() } : {}), role },
      });
      setNotice(res?.message ?? "Invitation sent");
      setEmail("");
      setName("");
      loadInvites();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send invitation");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    try {
      await api(`invites/${id}/revoke`, { method: "POST", tenantId });
      loadInvites();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not revoke invitation");
    }
  }

  const pendingInvites = (invites ?? []).filter((i) => i.status === "pending");
  const pendingCount = pendingInvites.length;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 pb-8">
      <PageHeader
        title="People"
        description="Everyone in this workspace — invite tenants, agents and co-landlords by email."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Members
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {members === null ? "…" : memberCount}
          </div>
          <div className="mt-1 text-xs text-muted">Active workspace users</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Verified
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {members === null ? "…" : verifiedCount}
          </div>
          <div className="mt-1 text-xs text-muted">Email-verified accounts</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Invites
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {invites === null ? "…" : inviteCount}
          </div>
          <div className="mt-1 text-xs text-muted">All invitation records</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Pending
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {invites === null ? "…" : pendingCount}
          </div>
          <div className="mt-1 text-xs text-muted">Waiting to accept</div>
        </div>
      </div>

      {canInvite ? (
        <section className="card grid gap-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Invite someone</h2>
          <form onSubmit={sendInvite} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto_auto]">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
            />
            <div className="flex rounded-[12px] border border-border p-0.5">
              {inviteRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-sm transition-colors",
                    role === r.value
                      ? "bg-brand-soft font-medium text-brand-ink"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send invite"}
            </Button>
          </form>
          {error ? <div className="text-sm text-danger">{error}</div> : null}
          {notice ? <div className="text-sm text-success">{notice}</div> : null}
        </section>
      ) : null}

      {canInvite && pendingInvites.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Pending invitations</h2>
          <div className="card-flat divide-y divide-border">
            {pendingInvites.map((i) => (
              <div key={i.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{i.email}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {i.name ? `${i.name} · ` : ""}expires {formatDate(i.expiresAt)}
                  </div>
                </div>
                <Badge tone={roleTone(i.role)} className="capitalize">
                  {i.role.replaceAll("_", " ")}
                </Badge>
                <button
                  onClick={() => revoke(i.id)}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Members</h2>
        {members === null ? (
          <Skeleton className="h-[220px]" />
        ) : members.length === 0 ? (
          <div className="card-flat px-5 py-8 text-center text-sm text-muted">
            No members found.
          </div>
        ) : (
          <div className="card-flat divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">
                  {m.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="truncate text-xs text-muted">{m.email}</div>
                </div>
                {!m.emailVerified ? (
                  <span className="text-xs text-muted">unverified</span>
                ) : null}
                <Badge tone={roleTone(m.role)} className="capitalize">
                  {m.role.replaceAll("_", " ").toLowerCase()}
                </Badge>
                <span className="hidden text-xs text-muted sm:block">
                  joined {formatDate(m.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
