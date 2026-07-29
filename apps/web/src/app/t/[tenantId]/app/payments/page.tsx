"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, paymentStatusTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

type Payment = {
  id: string;
  tenancyId: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
};

type Schedule = {
  id: string;
  tenancyId: string;
  amount: number;
  currency: string;
  frequency: string;
  nextDueDate: string;
  status: string;
};

export default function PaymentsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [schedules, setSchedules] = React.useState<Schedule[] | null>(null);
  const totalPayments = payments?.length ?? 0;
  const onTimeCount = payments?.filter((p) => p.status.toLowerCase() === "paid").length ?? 0;
  const activeSchedules = schedules?.filter((s) => s.status === "ACTIVE").length ?? 0;
  const lateOrMissed =
    payments?.filter((p) => ["late", "missed"].includes(p.status.toLowerCase())).length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 50 } })
      .then((r) => {
        if (!cancelled) setPayments(r.payments ?? []);
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      });

    api<{ schedules: Schedule[] }>("payments/schedules", { tenantId })
      .then((r) => {
        if (!cancelled) setSchedules(r.schedules ?? []);
      })
      .catch(() => {
        if (!cancelled) setSchedules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 pb-8">
      <PageHeader
        title="Payments"
        description="Rent payments and recurring schedules across your portfolio."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Payments
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : totalPayments}
          </div>
          <div className="mt-1 text-xs text-muted">Recorded in this workspace</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            On time
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : onTimeCount}
          </div>
          <div className="mt-1 text-xs text-muted">
            {payments && payments.length > 0
              ? `${Math.round((onTimeCount / payments.length) * 100)}% of payments`
              : "Nothing to compare yet"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Active schedules
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {schedules === null ? "…" : activeSchedules}
          </div>
          <div className="mt-1 text-xs text-muted">Recurring rent plans</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Late / missed
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : lateOrMissed}
          </div>
          <div className="mt-1 text-xs text-muted">Needs attention now</div>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Payment history</h2>
        {payments === null ? (
          <Skeleton className="h-[240px]" />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            body="Payments initiated for tenancies in this workspace will appear here with their status."
          />
        ) : (
          <div className="card-flat overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Tenancy</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Recorded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.tenancyId}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Recurring schedules</h2>
        {schedules === null ? (
          <Skeleton className="h-[120px]" />
        ) : schedules.length === 0 ? (
          <div className="card p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_240px] sm:items-center">
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  No recurring schedules configured
                </div>
                <div className="mt-2 text-sm leading-6 text-muted">
                  Once a tenancy has a billing cadence, the schedule cards will
                  appear here and show the next due date.
                </div>
              </div>
              <div className="rounded-[18px] border border-border bg-brand-soft/60 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Schedule preview
                </div>
                <div className="mt-2 text-sm font-semibold tracking-tight">Monthly</div>
                <div className="mt-1 text-xs text-muted">Next due: 28 Jul</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedules.map((s) => (
              <div key={s.id} className="card-flat p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {formatMoney(s.amount, s.currency)}
                  </div>
                  <Badge tone={s.status === "ACTIVE" ? "success" : "neutral"}>
                    {s.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-1 text-xs capitalize text-muted">
                  {s.frequency.toLowerCase()} · next due {formatDate(s.nextDueDate)}
                </div>
                <div className="mt-2 font-mono text-[11px] text-muted">
                  {s.tenancyId}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
