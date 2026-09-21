"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <PageHeader
        eyebrow="Trust Profile"
        title="Your TenantSea Trust Profile"
        description="Your verified digital tenancy profile makes securing your next home fast and effortless."
      />

      {profile === null && !error ? (
        <Skeleton className="h-[280px]" />
      ) : error ? (
        <div className="card p-6 text-sm text-muted">{error}</div>
      ) : profile ? (
        <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
          <div className="card flex flex-col items-center justify-center p-6 text-center">
            <div className="text-xs font-bold text-[#004b49]">Trust Score</div>
            <div className="mt-5 flex h-32 w-32 items-center justify-center rounded-full border-[8px] border-[#4d8f2b] bg-white"><div><div className={`text-3xl font-bold ${scoreTone(profile.trustScore)}`}>{profile.trustScore}</div><div className="text-[10px] text-[#71817e]">/100</div></div></div>
            <div className="mt-4 rounded-full bg-[#f2fff0] px-3 py-1 text-[10px] font-bold text-[#45863b]">Excellent Standing</div>
            <Button size="sm" className="mt-4 bg-[#4d8f2b] text-white hover:bg-[#3f7824]">Improve your score</Button>
          </div>
          <div className="grid gap-2">
            <TrustCriterion label="Payment History" detail="Perfect track record of timely monthly payments" value={profile.summary.late || profile.summary.missed ? "Needs attention" : "Excellent"} />
            <TrustCriterion label="Tenancy Duration" detail="Average tenancy lease completion active" value="Good" />
            <TrustCriterion label="Document Verification" detail="Government-issued ID and references authenticated" value="Verified" />
            <TrustCriterion label="Landlord Rating" detail="Consistent rating from previous landlords" value="4.8 / 5 Stars" />
          </div>

          <section className="hidden grid gap-3">
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

          <div className="hidden card p-5 text-sm text-muted">
            Scores start at 60. On-time payments add points; late, partial and missed
            payments reduce them. Paying rent consistently helps your score over time.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrustCriterion({ label, detail, value }: { label: string; detail: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-[8px] border border-[#dfe7e3] bg-white px-4 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2fff0] text-xs text-[#45863b]">✓</span><div className="min-w-0 flex-1"><div className="text-xs font-bold text-[#24211f]">{label}</div><div className="truncate text-[10px] text-[#71817e]">{detail}</div></div><span className="text-[10px] font-bold text-[#45863b]">{value}</span></div>;
}
