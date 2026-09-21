"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import { RequirePrivileged } from "@/components/app/require-privileged";

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

type Property = { id: string; title: string; rentAmount: number; currency: string };
type Member = { id: string; name: string; role: string };

export default function TenanciesPage() {
  return (
    <RequirePrivileged redirectTo="app/my-tenancy">
      <TenanciesPageContent />
    </RequirePrivileged>
  );
}

function TenanciesPageContent() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [items, setItems] = React.useState<Tenancy[] | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [total, setTotal] = React.useState(0);
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    propertyId: "",
    tenantUserId: "",
    agentId: "",
    rentAmount: "",
    currency: "NGN",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const propertyMap = React.useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties],
  );
  const memberMap = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const tenants = members.filter((m) => m.role.toLowerCase() === "tenant");
  const agents = members.filter((m) =>
    ["letting_agent", "landlord", "admin"].includes(m.role.toLowerCase()),
  );

  const activeCount = items?.filter((t) => t.status === "ACTIVE").length ?? 0;
  const pendingCount = items?.filter((t) => t.status === "PENDING").length ?? 0;
  const endedCount = items?.filter((t) => t.status === "ENDED").length ?? 0;

  const loadTenancies = React.useCallback(() => {
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
  }, [tenantId]);

  React.useEffect(() => {
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((r) => setCurrentUserId(r.user.id))
      .catch(() => setCurrentUserId(""));
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 100 } })
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]));
    api<{ users: Member[] }>("users", { tenantId, query: { limit: 100 } })
      .then((r) => setMembers(r.users ?? []))
      .catch(() => setMembers([]));
    loadTenancies();
  }, [tenantId, loadTenancies]);

  function resetForm() {
    setEditingId(null);
    setForm({
      propertyId: "",
      tenantUserId: "",
      agentId: "",
      rentAmount: "",
      currency: "NGN",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    });
    setFormError(null);
  }

  function onPropertyChange(propertyId: string) {
    const property = propertyMap.get(propertyId);
    setForm((prev) => ({
      ...prev,
      propertyId,
      rentAmount: property ? String(property.rentAmount) : prev.rentAmount,
      currency: property?.currency ?? prev.currency,
    }));
  }

  function startEdit(t: Tenancy) {
    setEditingId(t.id);
    setForm({
      propertyId: t.propertyId,
      tenantUserId: t.tenantUserId,
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
    if (!currentUserId) {
      setFormError("Sign in again to manage tenancies.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        tenantId,
        propertyId: form.propertyId,
        tenantUserId: form.tenantUserId,
        landlordId: currentUserId,
        ...(form.agentId ? { agentId: form.agentId } : {}),
        rentAmount: Number(form.rentAmount),
        currency: form.currency || "NGN",
        startDate: form.startDate,
        ...(form.endDate.trim() ? { endDate: form.endDate.trim() } : {}),
        status: form.status.toLowerCase() as "pending" | "active" | "ended",
      };

      await api(editingId ? `tenancies/${editingId}` : "tenancies", {
        method: editingId ? "PATCH" : "POST",
        tenantId,
        query: { tenantId },
        body: payload,
      });
      resetForm();
      loadTenancies();
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
      loadTenancies();
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
        action={
          <Link href={`/t/${tenantId}/app/tenancies/create`}><Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Create Tenancy</Button></Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Active</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {items === null ? "…" : activeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Currently occupied tenancies</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Pending</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {items === null ? "…" : pendingCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Awaiting move-in</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Ended</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">
            {items === null ? "…" : endedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Archived tenancy records</div>
        </div>
      </div>

      <div className="card rounded-[8px] p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitTenancy}>
          <Select
            value={form.propertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            required
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Select
            value={form.tenantUserId}
            onChange={(e) => setForm((p) => ({ ...p, tenantUserId: e.target.value }))}
            required
          >
            <option value="">Select tenant</option>
            {tenants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <Select
            value={form.agentId}
            onChange={(e) => setForm((p) => ({ ...p, agentId: e.target.value }))}
          >
            <option value="">No assigned agent</option>
            {agents.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <Select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="ENDED">Ended</option>
          </Select>
          <Input
            value={form.rentAmount}
            onChange={(e) => setForm((p) => ({ ...p, rentAmount: e.target.value }))}
            placeholder="Rent amount"
            type="number"
            min="0"
            required
          />
          <Input
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
            placeholder="Currency"
          />
          <Input
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            type="date"
            required
          />
          <Input
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            type="date"
          />
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Update tenancy" : "Create tenancy"}
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        {tenants.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">
            Invite tenants from the People page before creating a tenancy.
          </div>
        ) : null}
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
        <div className="card overflow-x-auto rounded-[8px]">
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
                  <td className="px-4 py-4">
                    <Link href={`/t/${tenantId}/app/tenancies/${t.id}`} className="font-medium text-teal hover:underline">
                      {propertyMap.get(t.propertyId)?.title ?? t.propertyId}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {memberMap.get(t.tenantUserId)?.name ?? t.tenantUserId}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(t.rentAmount, t.currency)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {formatDate(t.startDate)} — {t.endDate ? formatDate(t.endDate) : "ongoing"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={tenancyStatusTone(t.status)}>{t.status.toLowerCase()}</Badge>
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
