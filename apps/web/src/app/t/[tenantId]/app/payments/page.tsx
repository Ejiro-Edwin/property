"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, paymentStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { isTenantRole } from "@/lib/roles";

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

type Tenancy = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  rentAmount: number;
  currency: string;
};

type Property = { id: string; title: string };
type Member = { id: string; name: string; role: string };

function canManagePayments(role: string | undefined) {
  const r = (role ?? "").toLowerCase();
  return r === "landlord" || r === "admin";
}

export default function PaymentsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [payments, setPayments] = React.useState<Payment[] | null>(null);
  const [schedules, setSchedules] = React.useState<Schedule[] | null>(null);
  const [tenancies, setTenancies] = React.useState<Tenancy[]>([]);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [role, setRole] = React.useState<string | undefined>();
  const [meId, setMeId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = React.useState({
    tenancyId: "",
    amount: "",
    currency: "NGN",
    frequency: "monthly",
    nextDueDate: "",
  });

  const [initiateForm, setInitiateForm] = React.useState({
    tenancyId: "",
    payerId: "",
    amount: "",
    currency: "NGN",
    dueDate: "",
  });

  const [verifyForm, setVerifyForm] = React.useState({
    paymentId: "",
    status: "paid",
    verifiedAmount: "",
  });

  const propertyMap = React.useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties],
  );
  const memberMap = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const tenancyLabel = React.useCallback(
    (tenancyId: string) => {
      const t = tenancies.find((x) => x.id === tenancyId);
      if (!t) return tenancyId;
      const prop = propertyMap.get(t.propertyId)?.title ?? t.propertyId;
      const tenant = memberMap.get(t.tenantUserId)?.name ?? t.tenantUserId;
      return `${prop} · ${tenant}`;
    },
    [tenancies, propertyMap, memberMap],
  );

  const loadAll = React.useCallback(() => {
    setPayments(null);
    setSchedules(null);
    api<{ payments: Payment[] }>("payments/history", { tenantId, query: { limit: 50 } })
      .then((r) => setPayments(r.payments ?? []))
      .catch(() => setPayments([]));
    api<{ schedules: Schedule[] }>("payments/schedules", { tenantId })
      .then((r) => setSchedules(r.schedules ?? []))
      .catch(() => setSchedules([]));
  }, [tenantId]);

  React.useEffect(() => {
    api<{ user: { role?: string; id?: string } }>("auth/me", { tenantId })
      .then((r) => {
        setRole(r.user?.role);
        setMeId(r.user?.id ?? "");
      })
      .catch(() => {
        setRole(undefined);
        setMeId("");
      });
    api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 100 } })
      .then((r) => setTenancies(r.tenancies ?? []))
      .catch(() => setTenancies([]));
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 100 } })
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]));
    loadAll();
  }, [tenantId, loadAll]);

  React.useEffect(() => {
    if (!isTenantRole(role) || tenancies.length === 0 || !meId) return;
    const mine = tenancies.find((t) => t.tenantUserId === meId) ?? tenancies[0];
    if (!mine) return;
    setInitiateForm((prev) => ({
      ...prev,
      tenancyId: mine.id,
      payerId: meId,
      amount: prev.amount || String(mine.rentAmount),
      currency: mine.currency,
    }));
  }, [role, tenancies, meId]);

  React.useEffect(() => {
    if (isTenantRole(role)) return;
    api<{ users: Member[] }>("users", { tenantId, query: { limit: 100 } })
      .then((r) => setMembers(r.users ?? []))
      .catch(() => setMembers([]));
  }, [tenantId, role]);

  function onScheduleTenancyChange(tenancyId: string) {
    const t = tenancies.find((x) => x.id === tenancyId);
    setScheduleForm((prev) => ({
      ...prev,
      tenancyId,
      amount: t ? String(t.rentAmount) : prev.amount,
      currency: t?.currency ?? prev.currency,
    }));
  }

  function onInitiateTenancyChange(tenancyId: string) {
    const t = tenancies.find((x) => x.id === tenancyId);
    setInitiateForm((prev) => ({
      ...prev,
      tenancyId,
      payerId: t?.tenantUserId ?? prev.payerId,
      amount: t ? String(t.rentAmount) : prev.amount,
      currency: t?.currency ?? prev.currency,
    }));
  }

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setBusy("schedule");
    setError(null);
    setNotice(null);
    try {
      await api("payments/schedules", {
        method: "POST",
        tenantId,
        body: {
          tenantId,
          tenancyId: scheduleForm.tenancyId,
          amount: Number(scheduleForm.amount),
          currency: scheduleForm.currency,
          frequency: scheduleForm.frequency,
          nextDueDate: scheduleForm.nextDueDate,
        },
      });
      setNotice("Payment schedule created");
      setScheduleForm((p) => ({ ...p, tenancyId: "", nextDueDate: "" }));
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create schedule");
    } finally {
      setBusy(null);
    }
  }

  async function initiatePayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy("initiate");
    setError(null);
    setNotice(null);
    try {
      await api("payments/initiate", {
        method: "POST",
        tenantId,
        body: {
          tenantId,
          tenancyId: initiateForm.tenancyId,
          payerId: initiateForm.payerId,
          amount: Number(initiateForm.amount),
          currency: initiateForm.currency,
          ...(initiateForm.dueDate ? { dueDate: initiateForm.dueDate } : {}),
        },
      });
      setNotice("Payment initiated");
      setInitiateForm((p) => ({ ...p, tenancyId: "", dueDate: "" }));
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not initiate payment");
    } finally {
      setBusy(null);
    }
  }

  async function verifyPayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy("verify");
    setError(null);
    setNotice(null);
    try {
      await api("payments/verify", {
        method: "POST",
        tenantId,
        body: {
          tenantId,
          paymentId: verifyForm.paymentId,
          status: verifyForm.status,
          ...(verifyForm.verifiedAmount
            ? { verifiedAmount: Number(verifyForm.verifiedAmount) }
            : {}),
        },
      });
      setNotice("Payment verified");
      setVerifyForm({ paymentId: "", status: "paid", verifiedAmount: "" });
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify payment");
    } finally {
      setBusy(null);
    }
  }

  async function reconcile() {
    setBusy("reconcile");
    setError(null);
    setNotice(null);
    try {
      const res = await api<{ message?: string }>("payments/reconcile", {
        method: "POST",
        tenantId,
        query: { tenantId },
      });
      setNotice(res?.message ?? "Schedules reconciled");
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reconcile schedules");
    } finally {
      setBusy(null);
    }
  }

  const totalPayments = payments?.length ?? 0;
  const onTimeCount = payments?.filter((p) => p.status.toLowerCase() === "paid").length ?? 0;
  const activeSchedules = schedules?.filter((s) => s.status === "ACTIVE").length ?? 0;
  const lateOrMissed =
    payments?.filter((p) => ["late", "missed"].includes(p.status.toLowerCase())).length ?? 0;
  const pendingPayments =
    payments?.filter((p) => p.status.toLowerCase() === "pending") ?? [];
  const managePayments = canManagePayments(role);
  const isTenant = isTenantRole(role);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 pb-8">
      <PageHeader
        title={isTenant ? "My payments" : "Payments"}
        description={
          isTenant
            ? "Your rent payment history and record new payments for your tenancy."
            : "Rent payments and recurring schedules across your portfolio."
        }
        action={
          managePayments ? (
            <Button
              variant="secondary"
              disabled={busy === "reconcile"}
              onClick={reconcile}
            >
              {busy === "reconcile" ? "Reconciling…" : "Reconcile schedules"}
            </Button>
          ) : undefined
        }
      />

      {error ? <div className="text-sm text-danger">{error}</div> : null}
      {notice ? <div className="text-sm text-success">{notice}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Payments</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : totalPayments}
          </div>
          <div className="mt-1 text-xs text-muted">
            {isTenant ? "Linked to your tenancy" : "Recorded in this workspace"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">On time</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {payments === null ? "…" : onTimeCount}
          </div>
          <div className="mt-1 text-xs text-muted">
            {payments && payments.length > 0
              ? `${Math.round((onTimeCount / payments.length) * 100)}% of payments`
              : "Nothing to compare yet"}
          </div>
        </div>
        {!isTenant ? (
          <div className="card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              Active schedules
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {schedules === null ? "…" : activeSchedules}
            </div>
            <div className="mt-1 text-xs text-muted">Recurring rent plans</div>
          </div>
        ) : null}
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

      {tenancies.length > 0 ? (
        isTenant ? (
          <section className="card grid gap-3 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Record a payment</h2>
            <p className="text-sm text-muted">
              Submit a rent payment for your tenancy. Your landlord may verify it before it
              counts toward your trust score.
            </p>
            <form className="grid gap-3 sm:max-w-md" onSubmit={initiatePayment}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  value={initiateForm.amount}
                  onChange={(e) =>
                    setInitiateForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="Amount"
                  required
                />
                <Input
                  type="date"
                  value={initiateForm.dueDate}
                  onChange={(e) =>
                    setInitiateForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" disabled={busy === "initiate" || !initiateForm.tenancyId}>
                {busy === "initiate" ? "Recording…" : "Record payment"}
              </Button>
            </form>
          </section>
        ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card grid gap-3 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Create schedule</h2>
            <form className="grid gap-3" onSubmit={createSchedule}>
              <Select
                value={scheduleForm.tenancyId}
                onChange={(e) => onScheduleTenancyChange(e.target.value)}
                required
              >
                <option value="">Select tenancy</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tenancyLabel(t.id)}
                  </option>
                ))}
              </Select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  value={scheduleForm.amount}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="Amount"
                  required
                />
                <Select
                  value={scheduleForm.frequency}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, frequency: e.target.value }))
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </Select>
              </div>
              <Input
                type="date"
                value={scheduleForm.nextDueDate}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, nextDueDate: e.target.value }))
                }
                required
              />
              <Button type="submit" disabled={busy === "schedule"}>
                {busy === "schedule" ? "Creating…" : "Create schedule"}
              </Button>
            </form>
          </section>

          <section className="card grid gap-3 p-5">
            <h2 className="text-sm font-semibold tracking-tight">Record payment</h2>
            <form className="grid gap-3" onSubmit={initiatePayment}>
              <Select
                value={initiateForm.tenancyId}
                onChange={(e) => onInitiateTenancyChange(e.target.value)}
                required
              >
                <option value="">Select tenancy</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tenancyLabel(t.id)}
                  </option>
                ))}
              </Select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  value={initiateForm.amount}
                  onChange={(e) =>
                    setInitiateForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="Amount"
                  required
                />
                <Input
                  type="date"
                  value={initiateForm.dueDate}
                  onChange={(e) =>
                    setInitiateForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" disabled={busy === "initiate"}>
                {busy === "initiate" ? "Recording…" : "Initiate payment"}
              </Button>
            </form>
          </section>
        </div>
        )
      ) : (
        <div className="card p-5 text-sm text-muted">
          {isTenant
            ? "You don't have a tenancy yet — your landlord will assign one before you can record payments."
            : "Create a tenancy first — then you can set up schedules and record payments."}
        </div>
      )}

      {managePayments && pendingPayments.length > 0 ? (
        <section className="card grid gap-3 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Verify payment</h2>
          <form className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={verifyPayment}>
            <Select
              value={verifyForm.paymentId}
              onChange={(e) => setVerifyForm((p) => ({ ...p, paymentId: e.target.value }))}
              required
            >
              <option value="">Select pending payment</option>
              {pendingPayments.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatMoney(p.amount, p.currency)} · {tenancyLabel(p.tenancyId)}
                </option>
              ))}
            </Select>
            <Select
              value={verifyForm.status}
              onChange={(e) => setVerifyForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="late">Late</option>
              <option value="missed">Missed</option>
            </Select>
            <Input
              type="number"
              min="0"
              value={verifyForm.verifiedAmount}
              onChange={(e) =>
                setVerifyForm((p) => ({ ...p, verifiedAmount: e.target.value }))
              }
              placeholder="Verified amount (optional)"
            />
            <Button type="submit" disabled={busy === "verify"}>
              {busy === "verify" ? "Saving…" : "Verify"}
            </Button>
          </form>
        </section>
      ) : null}

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
                  {!isTenant ? (
                    <th className="px-4 py-3 font-medium">Tenancy</th>
                  ) : null}
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
                    {!isTenant ? (
                      <td className="px-4 py-3">{tenancyLabel(p.tenancyId)}</td>
                    ) : null}
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

      {!isTenant ? (
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Recurring schedules</h2>
        {schedules === null ? (
          <Skeleton className="h-[120px]" />
        ) : schedules.length === 0 ? (
          <EmptyState
            title="No recurring schedules"
            body="Create a schedule above to automate rent due dates for a tenancy."
          />
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
                <div className="mt-2 text-xs text-muted">{tenancyLabel(s.tenancyId)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      ) : schedules && schedules.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Your rent schedule</h2>
          <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
