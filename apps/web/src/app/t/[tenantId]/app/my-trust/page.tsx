"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MyTrustPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [profile, setProfile] = React.useState<TrustProfile | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((r) => api<TrustProfile>(`trust/${r.user.id}`, { tenantId }))
      .then(setProfile)
      .catch((err) => {
        setProfile(null);
        setError(err instanceof ApiError ? err.message : "Could not load trust score");
      });
  }, [tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <PageHeader
        title="Your trust score"
        description="How landlords see your payment reliability — built from real rent history."
      />

      {profile === null && !error ? (
        <Skeleton className="h-[280px]" />
      ) : error ? (
        <div className="card p-6 text-sm text-muted">{error}</div>
      ) : profile ? (
        <div className="grid gap-6">
          <div className="card flex flex-col items-center p-8 text-center sm:flex-row sm:text-left">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                Trust score
              </div>
              <div className={`mt-1 text-6xl font-semibold tracking-tight ${scoreTone(profile.trustScore)}`}>
                {profile.trustScore}
              </div>
              <div className="mt-1 text-sm text-muted">out of 100</div>
            </div>
            <div className="mt-6 grid flex-1 grid-cols-2 gap-4 text-sm sm:mt-0 sm:ml-auto sm:grid-cols-4">
              <div>
                <div className="text-muted">On time</div>
                <div className="text-lg font-semibold">{profile.summary.onTime}</div>
              </div>
              <div>
                <div className="text-muted">Late</div>
                <div className="text-lg font-semibold">{profile.summary.late}</div>
              </div>
              <div>
                <div className="text-muted">Partial</div>
                <div className="text-lg font-semibold">{profile.summary.partial}</div>
              </div>
              <div>
                <div className="text-muted">Missed</div>
                <div className="text-lg font-semibold">{profile.summary.missed}</div>
              </div>
            </div>
          </div>

          <section className="grid gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Rental history</h2>
            {profile.rentalHistory.length === 0 ? (
              <div className="card-flat px-5 py-8 text-center text-sm text-muted">
                No tenancy history yet.
              </div>
            ) : (
              <div className="card-flat divide-y divide-border">
                {profile.rentalHistory.map((h) => (
                  <div key={h.tenancyId} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <div className="text-sm font-medium">{formatMoney(h.rentAmount)} / yr</div>
                      <div className="text-xs text-muted">{h.period}</div>
                    </div>
                    <Badge tone={tenancyStatusTone(h.status)}>{h.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="card p-5 text-sm text-muted">
            Scores start at 60. On-time payments add points; late, partial and missed
            payments reduce them. Paying rent consistently helps your score over time.
          </div>
        </div>
      ) : null}
    </div>
  );
}
