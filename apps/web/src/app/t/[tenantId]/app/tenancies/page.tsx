"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    propertyId: "",
    tenantUserId: "",
    landlordId: "",
    agentId: "",
    rentAmount: "",
    currency: "NGN",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });
  const activeCount = items?.filter((t) => t.status === "ACTIVE").length ?? 0;
  const pendingCount = items?.filter((t) => t.status === "PENDING").length ?? 0;
  const endedCount = items?.filter((t) => t.status === "ENDED").length ?? 0;

  React.useEffect(() => {
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((r) => setCurrentUserId(r.user.id))
      .catch(() => setCurrentUserId(""));
  }, [tenantId]);

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

  React.useEffect(() => {
    if (!editingId && currentUserId) {
      setForm((prev) => (prev.landlordId ? prev : { ...prev, landlordId: currentUserId }));
    }
  }, [currentUserId, editingId]);

  function resetForm() {
    setEditingId(null);
    setForm({
      propertyId: "",
      tenantUserId: "",
      landlordId: currentUserId,
      agentId: "",
      rentAmount: "",
      currency: "NGN",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    });
    setFormError(null);
  }

  function startEdit(t: Tenancy) {
    setEditingId(t.id);
    setForm({
      propertyId: t.propertyId,
      tenantUserId: t.tenantUserId,
      landlordId: currentUserId || "",
      agentId: "",
      rentAmount: String(t.rentAmount),
      currency: t.currency ?? "NGN",
      startDate: t.startDate.slice(0, 10),
      endDate: t.endDate ? t.endDate.slice(0, 10) : "",
      status: t.status,
    });
    setFormError(null);
  }

  async function submitTenancy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        tenantId,
        propertyId: form.propertyId,
        tenantUserId: form.tenantUserId,
        landlordId: form.landlordId,
        ...(form.agentId.trim() ? { agentId: form.agentId.trim() } : {}),
        rentAmount: Number(form.rentAmount),
        currency: form.currency || "NGN",
        startDate: form.startDate,
        ...(form.endDate.trim() ? { endDate: form.endDate.trim() } : {}),
        status: form.status as "pending" | "active" | "ended",
      };

      await api(editingId ? `tenancies/${editingId}` : "tenancies", {
        method: editingId ? "PATCH" : "POST",
        tenantId,
        query: { tenantId },
        body: payload,
      });
      resetForm();
      setItems(null);
      api<{ tenancies: Tenancy[]; meta: { total: number } }>("tenancies", {
        tenantId,
        query: { limit: 50 },
      })
        .then((r) => {
          setItems(r.tenancies ?? []);
          setTotal(r.meta?.total ?? 0);
        })
        .catch(() => setItems([]));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save tenancy");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTenancy(id: string) {
    if (!confirm("Delete this tenancy?")) return;
    try {
      await api(`tenancies/${id}`, { method: "DELETE", tenantId, query: { tenantId } });
      if (editingId === id) resetForm();
      setItems(null);
      api<{ tenancies: Tenancy[]; meta: { total: number } }>("tenancies", {
        tenantId,
        query: { limit: 50 },
      })
        .then((r) => {
          setItems(r.tenancies ?? []);
          setTotal(r.meta?.total ?? 0);
        })
        .catch(() => setItems([]));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete tenancy");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        title="Tenancies"
        description={
          items ? `${total} tenanc${total === 1 ? "y" : "ies"} in this workspace.` : undefined
        }
        action={<Button variant="secondary" onClick={resetForm}>New tenancy</Button>}
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

      <div className="card p-4">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitTenancy}>
          <Input value={form.propertyId} onChange={(e) => setForm((p) => ({ ...p, propertyId: e.target.value }))} placeholder="Property ID" required />
          <Input value={form.tenantUserId} onChange={(e) => setForm((p) => ({ ...p, tenantUserId: e.target.value }))} placeholder="Tenant user ID" required />
          <Input value={form.landlordId} onChange={(e) => setForm((p) => ({ ...p, landlordId: e.target.value }))} placeholder="Landlord user ID" required />
          <Input value={form.agentId} onChange={(e) => setForm((p) => ({ ...p, agentId: e.target.value }))} placeholder="Agent user ID (optional)" />
          <Input value={form.rentAmount} onChange={(e) => setForm((p) => ({ ...p, rentAmount: e.target.value }))} placeholder="Rent amount" type="number" min="0" required />
          <Input value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} placeholder="Currency" />
          <Input value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} placeholder="Start date (YYYY-MM-DD)" />
          <Input value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} placeholder="End date (optional)" />
          <Input value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} placeholder="Status (PENDING | ACTIVE | ENDED)" />
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Update tenancy" : "Create tenancy"}</Button>
            {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
          </div>
        </form>
        {formError ? <div className="mt-3 text-sm text-danger">{formError}</div> : null}
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
                <th className="px-4 py-3 font-medium">Actions</th>
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
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(t)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteTenancy(t.id)}>
                        Delete
                      </Button>
                    </div>
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
