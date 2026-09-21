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
type PaymentMethod = { id: string; type: string; label: string; last4?: string | null; isDefault: boolean };

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
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[] | null>(null);
  const [methodModal, setMethodModal] = React.useState<"choose" | "card" | "bank" | "success" | null>(null);
  const [methodBusy, setMethodBusy] = React.useState(false);
  const [cardForm, setCardForm] = React.useState({ cardholderName: "", cardNumber: "", expiry: "", cvv: "", billingAddress: "" });
  const [bankForm, setBankForm] = React.useState({ bankName: "", accountNumber: "", accountName: "", accountType: "savings" });

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

  React.useEffect(() => {
    if (!isTenantRole(role)) return;
    api<{ paymentMethods: PaymentMethod[] }>("payment-methods", { tenantId })
      .then((r) => setPaymentMethods(r.paymentMethods ?? []))
      .catch(() => setPaymentMethods([]));
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

  async function addPaymentMethod(event: React.FormEvent) {
    event.preventDefault();
    setMethodBusy(true);
    try {
      await api("payment-methods", { method: "POST", tenantId, body: { tenantId, type: methodModal === "bank" ? "BANK_ACCOUNT" : "CARD", ...(methodModal === "bank" ? bankForm : cardForm) } });
      setMethodModal("success");
      api<{ paymentMethods: PaymentMethod[] }>("payment-methods", { tenantId }).then((result) => setPaymentMethods(result.paymentMethods ?? []));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add payment method");
    } finally {
      setMethodBusy(false);
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Payments</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {payments === null ? "…" : totalPayments}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isTenant ? "Linked to your tenancy" : "Recorded in this workspace"}
          </div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">On time</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {payments === null ? "…" : onTimeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {payments && payments.length > 0
              ? `${Math.round((onTimeCount / payments.length) * 100)}% of payments`
              : "Nothing to compare yet"}
          </div>
        </div>
        {!isTenant ? (
          <div className="metric-card p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Active schedules
            </div>
            <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
              {schedules === null ? "…" : activeSchedules}
            </div>
            <div className="mt-1 text-xs text-slate-500">Recurring rent plans</div>
          </div>
        ) : null}
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Late / missed
          </div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {payments === null ? "…" : lateOrMissed}
          </div>
          <div className="mt-1 text-xs text-slate-500">Needs attention now</div>
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

      {isTenant ? (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><h2 className="font-semibold text-teal">Payment methods</h2><p className="mt-1 text-xs text-muted">Choose how you pay rent.</p></div>
            <Button size="sm" onClick={() => setMethodModal("choose")} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">Add Payment Method</Button>
          </div>
          {paymentMethods === null ? <div className="p-5"><Skeleton className="h-16" /></div> : paymentMethods.length === 0 ? <div className="p-6 text-sm text-muted">No payment methods saved yet.</div> : <div className="divide-y divide-border">{paymentMethods.map((method) => <div key={method.id} className="flex items-center justify-between px-5 py-4"><div><div className="text-sm font-medium">{method.label}</div><div className="mt-1 text-xs text-muted">{method.type}{method.last4 ? ` ending ${method.last4}` : ""}</div></div>{method.isDefault ? <Badge tone="brand">Default</Badge> : null}</div>)}</div>}
        </section>
      ) : null}

      {isTenant && methodModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#004b49]/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-[430px] rounded-[10px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71817e]">{methodModal === "choose" ? "Add payment method" : methodModal === "success" ? "Card status" : methodModal === "bank" ? "Link bank account" : "Add debit or credit card"}</div><h2 className="mt-2 text-lg font-bold text-[#004b49]">{methodModal === "choose" ? "How would you like to pay?" : methodModal === "success" ? "Card added successfully" : methodModal === "bank" ? "Connect your bank account" : "Enter card details"}</h2></div><button type="button" onClick={() => setMethodModal(null)} className="text-[#71817e]">×</button></div>
            {methodModal === "choose" ? <div className="mt-6 grid gap-3"><button type="button" onClick={() => setMethodModal("card")} className="rounded-[8px] border border-[#b9dcae] p-4 text-left hover:bg-[#f2fff0]"><div className="font-semibold text-[#24211f]">Debit or Credit Card</div><div className="mt-1 text-xs text-[#71817e]">Visa, Mastercard and more</div></button><button type="button" onClick={() => setMethodModal("bank")} className="rounded-[8px] border border-[#dfe7e3] p-4 text-left hover:bg-[#f2fff0]"><div className="font-semibold text-[#24211f]">Bank Account</div><div className="mt-1 text-xs text-[#71817e]">Pay directly from your bank</div></button></div> : null}
            {methodModal === "card" ? <form className="mt-5 grid gap-3" onSubmit={addPaymentMethod}><Input value={cardForm.cardholderName} onChange={(event) => setCardForm({ ...cardForm, cardholderName: event.target.value })} placeholder="Cardholder name" required /><Input value={cardForm.cardNumber} onChange={(event) => setCardForm({ ...cardForm, cardNumber: event.target.value })} placeholder="Card number" required /><div className="grid grid-cols-2 gap-3"><Input value={cardForm.expiry} onChange={(event) => setCardForm({ ...cardForm, expiry: event.target.value })} placeholder="MM/YY" required /><Input value={cardForm.cvv} onChange={(event) => setCardForm({ ...cardForm, cvv: event.target.value })} placeholder="CVV" required /></div><Input value={cardForm.billingAddress} onChange={(event) => setCardForm({ ...cardForm, billingAddress: event.target.value })} placeholder="Billing address (optional)" /><Button disabled={methodBusy} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">{methodBusy ? "Saving…" : "Continue"}</Button></form> : null}
            {methodModal === "bank" ? <form className="mt-5 grid gap-3" onSubmit={addPaymentMethod}><Input value={bankForm.bankName} onChange={(event) => setBankForm({ ...bankForm, bankName: event.target.value })} placeholder="Select your bank" required /><Input value={bankForm.accountNumber} onChange={(event) => setBankForm({ ...bankForm, accountNumber: event.target.value })} placeholder="Account number" required /><Input value={bankForm.accountName} onChange={(event) => setBankForm({ ...bankForm, accountName: event.target.value })} placeholder="Account name" required /><Select value={bankForm.accountType} onChange={(event) => setBankForm({ ...bankForm, accountType: event.target.value })}><option value="savings">Savings</option><option value="current">Current</option></Select><Button disabled={methodBusy} className="bg-[#baff00] text-[#004b49] hover:bg-[#a9eb00]">{methodBusy ? "Linking…" : "Link bank account"}</Button></form> : null}
            {methodModal === "success" ? <div className="mt-6 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#baff00] text-xl text-[#004b49]">✓</div><p className="mt-4 text-sm text-[#71817e]">Your payment method has been added successfully and is ready to use.</p><Button className="mt-6 w-full" onClick={() => setMethodModal(null)}>Done</Button><button type="button" onClick={() => setMethodModal("choose")} className="mt-3 text-xs text-[#71817e]">Add another method</button></div> : null}
          </div>
        </div>
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
