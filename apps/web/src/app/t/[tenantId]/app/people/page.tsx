"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { RequirePrivileged } from "@/components/app/require-privileged";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
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

const memberRoles = [
  ...inviteRoles,
  { value: "admin", label: "Admin" },
];

function normalizeRole(role: string) {
  return role.toLowerCase().replaceAll("_", " ");
}

function canManageMembers(role: string | null | undefined) {
  const r = normalizeRole(role ?? "");
  return r === "landlord" || r === "letting agent" || r === "admin";
}

function canDeleteMembers(role: string | null | undefined) {
  const r = normalizeRole(role ?? "");
  return r === "landlord" || r === "admin";
}

function toApiRole(role: string) {
  return role.toLowerCase().replaceAll(" ", "_");
}

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
  return (
    <RequirePrivileged>
      <PeoplePageContent />
    </RequirePrivileged>
  );
}

function PeoplePageContent() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [invites, setInvites] = React.useState<Invite[] | null>(null);
  const [canInvite, setCanInvite] = React.useState(true);
  const [me, setMe] = React.useState<{
    id: string;
    role?: string;
  } | null>(null);

  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [memberBusy, setMemberBusy] = React.useState(false);
  const [memberError, setMemberError] = React.useState<string | null>(null);
  const [memberNotice, setMemberNotice] = React.useState<string | null>(null);
  const [memberForm, setMemberForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "tenant",
  });

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("tenant");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
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

  const loadMembers = React.useCallback(() => {
    return api<{ users: Member[] }>("users", { tenantId, query: { limit: 50 } })
      .then((r) => setMembers(r.users ?? []))
      .catch(() => setMembers([]));
  }, [tenantId]);

  React.useEffect(() => {
    api<{ user: { id: string; role?: string } }>("auth/me", { tenantId })
      .then((r) => setMe(r.user))
      .catch(() => setMe(null));
    loadMembers();
    loadInvites();
  }, [tenantId, loadInvites, loadMembers]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setInviteLink(null);
    setCopied(false);
    try {
      const res = await api<{ message?: string; emailSent?: boolean; inviteLink?: string }>("invites", {
        method: "POST",
        tenantId,
        body: { email, ...(name.trim() ? { name: name.trim() } : {}), role },
      });
      setNotice(res?.message ?? "Invitation sent");
      if (res?.inviteLink && !res.emailSent) {
        setInviteLink(res.inviteLink);
      }
      setEmail("");
      setName("");
      loadInvites();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send invitation");
    } finally {
      setBusy(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link — select and copy it manually");
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

  function resetMemberForm() {
    setEditingMemberId(null);
    setMemberForm({ name: "", email: "", phone: "", role: "tenant" });
    setMemberError(null);
    setMemberNotice(null);
  }

  function startEditMember(member: Member) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? "",
      role: toApiRole(member.role),
    });
    setMemberError(null);
    setMemberNotice(null);
  }

  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMemberId) return;
    setMemberBusy(true);
    setMemberError(null);
    setMemberNotice(null);
    try {
      await api(`users/${editingMemberId}`, {
        method: "PATCH",
        tenantId,
        query: { tenantId },
        body: {
          tenantId,
          id: editingMemberId,
          name: memberForm.name,
          email: memberForm.email,
          phone: memberForm.phone,
          role: memberForm.role,
        },
      });
      setMemberNotice("Member updated");
      resetMemberForm();
      loadMembers();
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : "Could not update member");
    } finally {
      setMemberBusy(false);
    }
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    setMemberError(null);
    try {
      await api(`users/${id}`, { method: "DELETE", tenantId, query: { tenantId } });
      if (editingMemberId === id) resetMemberForm();
      loadMembers();
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : "Could not remove member");
    }
  }

  const pendingInvites = (invites ?? []).filter((i) => i.status === "pending");
  const manageMembers = canManageMembers(me?.role);
  const removeMembers = canDeleteMembers(me?.role);
  const pendingCount = pendingInvites.length;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 pb-8">
      <PageHeader
        title="People"
        description="Everyone in this workspace — invite tenants, agents and co-landlords by email."
        action={<Link href={`/t/${tenantId}/app/people/add`}><Button className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">Add Tenant</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Members</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {members === null ? "…" : memberCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active workspace users</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Verified</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {members === null ? "…" : verifiedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Email-verified accounts</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Invites</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {invites === null ? "…" : inviteCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">All invitation records</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Pending</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {invites === null ? "…" : pendingCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Waiting to accept</div>
        </div>
      </div>

      {canInvite ? (
        <section className="card grid gap-4 rounded-[8px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-sm font-semibold tracking-tight text-[#0f172a]">Invite someone</h2>
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
            <div className="flex rounded-[12px] border border-[#dfe7e3] bg-[#f8faf9] p-0.5">
              {inviteRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-sm transition-colors",
                    role === r.value
                      ? "bg-[#efffee] font-medium text-[#004b49]"
                      : "text-slate-500 hover:text-slate-800",
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
          {inviteLink ? (
            <div className="grid gap-2 rounded-[12px] border border-border bg-charcoal-soft p-4">
              <div className="text-sm font-medium">Share this invite link</div>
              <p className="text-sm text-muted">
                Email isn&apos;t configured yet — send this link to your invitee directly (WhatsApp,
                SMS, etc.). It expires in 7 days.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={inviteLink} className="font-mono text-xs" />
                <Button type="button" variant="secondary" onClick={copyInviteLink}>
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
          ) : null}
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

      {manageMembers && editingMemberId && editingMemberId !== me?.id ? (
        <section className="card grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Edit member</h2>
            <button
              type="button"
              onClick={resetMemberForm}
              className="text-xs font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={saveMember} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={memberForm.name}
                onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                required
              />
              <Input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Input
                value={memberForm.phone}
                onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone (optional)"
              />
              <div className="flex rounded-[12px] border border-border p-0.5">
                {memberRoles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setMemberForm((p) => ({ ...p, role: r.value }))}
                    className={cn(
                      "rounded-[10px] px-3 py-1.5 text-sm transition-colors",
                      memberForm.role === r.value
                        ? "bg-brand-soft font-medium text-brand-ink"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={memberBusy}>
                {memberBusy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
          {memberError ? <div className="text-sm text-danger">{memberError}</div> : null}
          {memberNotice ? <div className="text-sm text-success">{memberNotice}</div> : null}
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Members</h2>
        {memberError && !editingMemberId ? (
          <div className="text-sm text-danger">{memberError}</div>
        ) : null}
        {members === null ? (
          <Skeleton className="h-[220px]" />
        ) : members.length === 0 ? (
          <div className="card-flat px-5 py-8 text-center text-sm text-muted">
            No members found.
          </div>
        ) : (
          <div className="card-flat divide-y divide-border">
            {members.map((m) => {
              const isSelf = m.id === me?.id;
              const showActions = manageMembers && !isSelf;
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">
                    {m.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/t/${tenantId}/app/people/${m.id}`} className="truncate text-sm font-medium hover:text-[#45863b]">
                      {m.name}
                      {isSelf ? (
                        <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>
                      ) : null}
                    </Link>
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
                  {showActions ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditMember(m)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Edit
                      </button>
                      {removeMembers ? (
                        <button
                          type="button"
                          onClick={() => deleteMember(m.id, m.name)}
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
