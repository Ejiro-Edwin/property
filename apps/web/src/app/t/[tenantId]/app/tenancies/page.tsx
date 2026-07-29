"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Tenancy = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  status: string;
};

export default function TenanciesPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [items, setItems] = React.useState<Tenancy[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const activeCount = items?.filter((t) => t.status === "ACTIVE").length ?? 0;
  const pendingCount = items?.filter((t) => t.status === "PENDING").length ?? 0;
  const endedCount = items?.filter((t) => t.status === "ENDED").length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    api<{ tenancies: Tenancy[]; meta: { total: number } }>("tenancies", {
      tenantId,
      query: { limit: 50 },
    })
      .then((r) => {
        if (cancelled) return;
        setItems(r.tenancies ?? []);
        setTotal(r.meta?.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        title="Tenancies"
        description={
          items ? `${total} tenanc${total === 1 ? "y" : "ies"} in this workspace.` : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Active
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : activeCount}
          </div>
          <div className="mt-1 text-xs text-muted">Currently occupied tenancies</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Pending
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : pendingCount}
          </div>
          <div className="mt-1 text-xs text-muted">Awaiting move-in</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Ended
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : endedCount}
          </div>
          <div className="mt-1 text-xs text-muted">Archived tenancy records</div>
        </div>
      </div>

      {items === null ? (
        <Skeleton className="h-[280px]" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No tenancies yet"
          body="When a tenant is placed in a property, the tenancy—its rent, dates and status—will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-4 font-mono text-xs">{t.propertyId}</td>
                  <td className="px-4 py-4 font-mono text-xs">{t.tenantUserId}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(t.rentAmount, t.currency)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {formatDate(t.startDate)} — {t.endDate ? formatDate(t.endDate) : "ongoing"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={tenancyStatusTone(t.status)}>
                      {t.status.toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
