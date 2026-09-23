"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { RequirePrivileged } from "@/components/app/require-privileged";

type TrustProfile = {
  tenantUserId: string;
  trustScore: number;
  summary: {
    totalPayments: number;
    onTime: number;
    late: number;
    partial: number;
    missed: number;
  };
  rentalHistory: {
    tenancyId: string;
    status: string;
    rentAmount: number;
    period: string;
  }[];
};

type Member = { id: string; name: string; role: string };
type TenantTrust = {
  tenantUserId: string;
  name: string;
  email: string;
  trustScore: number;
  tenancyStatus: string;
  summary: { totalPayments: number; onTime: number; late: number; partial: number; missed: number };
  lastPaymentAt: string | null;
};

function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

export default function TrustPage() {
  return (
    <RequirePrivileged redirectTo="app/my-trust">
      <TrustPageContent />
    </RequirePrivileged>
  );
}

function TrustPageContent() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [tenants, setTenants] = React.useState<Member[]>([]);
  const [userId, setUserId] = React.useState("");
  const [profile, setProfile] = React.useState<TrustProfile | null>(null);
  const [tenantTrust, setTenantTrust] = React.useState<TenantTrust[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<{ tenantTrustProfiles: TenantTrust[] }>("trust/dashboard", { tenantId })
      .then((r) => setTenantTrust(r.tenantTrustProfiles ?? []))
      .catch(() => setTenantTrust([]));
    api<{ users: Member[] }>("users", { tenantId, query: { limit: 100 } })
      .then((r) =>
        setTenants(
          (r.users ?? []).filter((u) => u.role.toLowerCase() === "tenant"),
        ),
      )
      .catch(() => setTenants([]));
  }, [tenantId]);

  async function loadProfile(selectedUserId: string) {
    if (!selectedUserId) return;
    setBusy(true);
    setError(null);
    setProfile(null);
    try {
      const p = await api<TrustProfile>(`trust/${selectedUserId}`, { tenantId });
      setProfile(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load trust profile");
    } finally {
      setBusy(false);
    }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    await loadProfile(userId);
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <PageHeader
        eyebrow="Trust / Activity"
        title="Tenant Trust Scores"
        description="Review tenant payment behavior, tenancy status, and explainable trust scores."
      />

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Your tenants</h2>
          <span className="text-xs text-muted">{tenantTrust.length} profiles</span>
        </div>
        {tenantTrust.length === 0 ? (
          <div className="card-flat px-5 py-8 text-center text-sm text-muted">No tenant trust profiles yet.</div>
        ) : (
          <div className="card-flat overflow-x-auto rounded-[8px]">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Trust score</th>
                  <th className="px-4 py-3 font-medium">Payment history</th>
                  <th className="px-4 py-3 font-medium">Tenancy</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenantTrust.map((tenant) => (
                  <tr key={tenant.tenantUserId}>
                    <td className="px-4 py-3"><div className="font-medium">{tenant.name}</div><div className="text-xs text-muted">{tenant.email}</div></td>
                    <td className={`px-4 py-3 text-lg font-bold ${scoreTone(tenant.trustScore)}`}>{tenant.trustScore}<span className="ml-1 text-xs font-normal text-muted">/100</span></td>
                    <td className="px-4 py-3 text-muted">{tenant.summary.onTime} on time · {tenant.summary.late + tenant.summary.missed} attention</td>
                    <td className="px-4 py-3"><Badge tone={tenant.tenancyStatus === "active" ? "success" : tenant.tenancyStatus === "pending" ? "warning" : "neutral"}>{tenant.tenancyStatus}</Badge></td>
                    <td className="px-4 py-3 text-muted">{tenant.lastPaymentAt ? new Date(tenant.lastPaymentAt).toLocaleDateString() : "No payments"}</td>
                    <td className="px-4 py-3"><Button type="button" size="sm" variant="secondary" onClick={() => { setUserId(tenant.tenantUserId); void loadProfile(tenant.tenantUserId); }}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form onSubmit={lookup} className="flex max-w-lg flex-col gap-2 sm:flex-row">
        <Select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="min-w-0 flex-1"
        >
          <option value="">Select tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={busy || tenants.length === 0}>
          {busy ? "Loading…" : "Look up"}
        </Button>
      </form>

      {tenants.length === 0 ? (
        <div className="text-sm text-muted">
          Invite tenants from the People page to look up trust scores.
        </div>
      ) : null}

      {error ? <div className="text-sm text-danger">{error}</div> : null}

      {profile ? (
        <div className="grid gap-6">
          <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1f6b67]">
                Trust score
              </div>
              <div
                className={`mt-2 text-5xl font-semibold tracking-[-0.05em] ${scoreTone(profile.trustScore)}`}
              >
                {profile.trustScore}
              </div>
              <div className="mt-1 text-xs text-muted">out of 100</div>
            </div>
            <div className="ml-auto grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted">On time</div>
                <div className="font-semibold">{profile.summary.onTime}</div>
              </div>
              <div>
                <div className="text-muted">Late</div>
                <div className="font-semibold">{profile.summary.late}</div>
              </div>
              <div>
                <div className="text-muted">Partial</div>
                <div className="font-semibold">{profile.summary.partial}</div>
              </div>
              <div>
                <div className="text-muted">Missed</div>
                <div className="font-semibold">{profile.summary.missed}</div>
              </div>
            </div>
          </div>

          <section className="grid gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Rental history</h2>
            {profile.rentalHistory.length === 0 ? (
              <div className="card-flat px-5 py-8 text-center text-sm text-muted">
                No tenancy history for this user.
              </div>
            ) : (
              <div className="card-flat divide-y divide-border">
                {profile.rentalHistory.map((h) => (
                  <div
                    key={h.tenancyId}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {formatMoney(h.rentAmount)}
                        <span className="text-xs font-normal text-muted"> / yr</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted">{h.period}</div>
                    </div>
                    <Badge tone={tenancyStatusTone(h.status)}>{h.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : !error ? (
        <StatCard
          label="How it works"
          value="60 base"
          hint="+8 per on-time payment, −12 late, −5 partial, −15 missed. Clamped 0–100."
          className="max-w-lg"
        />
      ) : null}
    </div>
  );
}
