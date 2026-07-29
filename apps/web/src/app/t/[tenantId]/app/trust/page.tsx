"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

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

function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

export default function TrustPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [userId, setUserId] = React.useState("");
  const [profile, setProfile] = React.useState<TrustProfile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setProfile(null);
    try {
      const p = await api<TrustProfile>(`trust/${userId.trim()}`, { tenantId });
      setProfile(p);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load trust profile",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Trust"
        description="Explainable tenant trust scores based on payment behavior and tenancy history."
      />

      <form onSubmit={lookup} className="flex max-w-lg gap-2">
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Tenant user ID (e.g. cmd8x…)"
          required
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Loading…" : "Look up"}
        </Button>
      </form>

      {error ? <div className="text-sm text-danger">{error}</div> : null}

      {profile ? (
        <div className="grid gap-6">
          <div className="card flex items-center gap-6 p-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                Trust score
              </div>
              <div
                className={`mt-1 text-5xl font-semibold tracking-tight ${scoreTone(profile.trustScore)}`}
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
