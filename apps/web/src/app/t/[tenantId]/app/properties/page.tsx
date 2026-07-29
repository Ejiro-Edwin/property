"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
  createdAt: string;
};

export default function PropertiesPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [items, setItems] = React.useState<Property[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    address: "",
    landlordId: "",
    agentId: "",
    bedrooms: "",
    rentAmount: "",
    currency: "NGN",
  });
  const portfolioValue =
    items?.reduce((sum, p) => sum + p.rentAmount, 0) ?? 0;
  const avgRent =
    items && items.length > 0
      ? Math.round(portfolioValue / items.length)
      : 0;

  React.useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((r) => setCurrentUserId(r.user.id))
      .catch(() => setCurrentUserId(""));
  }, [tenantId]);

  const loadProperties = React.useCallback(() => {
    let cancelled = false;
    setItems(null);
    api<{ properties: Property[]; meta: { total: number } }>("properties", {
      tenantId,
      query: { limit: 30, ...(query ? { search: query } : {}) },
    })
      .then((r) => {
        if (cancelled) return;
        setItems(r.properties ?? []);
        setTotal(r.meta?.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, query]);

  React.useEffect(() => {
    return loadProperties();
  }, [loadProperties]);

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      address: "",
      landlordId: currentUserId,
      agentId: "",
      bedrooms: "",
      rentAmount: "",
      currency: "NGN",
    });
    setFormError(null);
  }

  React.useEffect(() => {
    if (!editingId && currentUserId) {
      setForm((prev) => (prev.landlordId ? prev : { ...prev, landlordId: currentUserId }));
    }
  }, [currentUserId, editingId]);

  function startEdit(p: Property) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      address: p.address,
      landlordId: currentUserId || "",
      agentId: "",
      bedrooms: String(p.bedrooms ?? ""),
      rentAmount: String(p.rentAmount),
      currency: p.currency ?? "NGN",
    });
    setFormError(null);
  }

  async function submitProperty(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        tenantId,
        title: form.title,
        address: form.address,
        landlordId: form.landlordId,
        ...(form.agentId.trim() ? { agentId: form.agentId.trim() } : {}),
        bedrooms: Number(form.bedrooms),
        rentAmount: Number(form.rentAmount),
        currency: form.currency || "NGN",
      };

      const res = await api(
        editingId ? `properties/${editingId}` : "properties",
        {
          method: editingId ? "PATCH" : "POST",
          tenantId,
          query: { tenantId },
          body: payload,
        },
      );
      setItems((prev) => {
        if (!prev) return prev;
        if (editingId) {
          return prev.map((item) =>
            item.id === editingId ? { ...item, ...(res as { property?: Property }).property } : item,
          );
        }
        return prev;
      });
      resetForm();
      loadProperties();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save property");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProperty(id: string) {
    if (!confirm("Delete this property?")) return;
    try {
      await api(`properties/${id}`, { method: "DELETE", tenantId, query: { tenantId } });
      if (editingId === id) resetForm();
      loadProperties();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete property");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        title="Properties"
        description={items ? `${total} propert${total === 1 ? "y" : "ies"} in this workspace.` : undefined}
        action={
          <Button
            onClick={resetForm}
            className="shrink-0"
            variant="secondary"
          >
            Add property
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Properties
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : total}
          </div>
          <div className="mt-1 text-xs text-muted">Listings in this workspace</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Portfolio value
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : formatMoney(portfolioValue)}
          </div>
          <div className="mt-1 text-xs text-muted">Annual rent across all properties</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Average rent
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {items === null ? "…" : formatMoney(avgRent)}
          </div>
          <div className="mt-1 text-xs text-muted">Per property, on average</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitProperty}>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Property title"
              required
            />
            <Input
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              required
            />
            <Input
              value={form.landlordId}
              onChange={(e) => setForm((prev) => ({ ...prev, landlordId: e.target.value }))}
              placeholder="Landlord user ID"
              required
            />
            <Input
              value={form.agentId}
              onChange={(e) => setForm((prev) => ({ ...prev, agentId: e.target.value }))}
              placeholder="Agent user ID (optional)"
            />
            <Input
              value={form.bedrooms}
              onChange={(e) => setForm((prev) => ({ ...prev, bedrooms: e.target.value }))}
              placeholder="Bedrooms"
              type="number"
              min="0"
              required
            />
            <Input
              value={form.rentAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, rentAmount: e.target.value }))}
              placeholder="Rent amount"
              type="number"
              min="0"
              required
            />
            <Input
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              placeholder="Currency"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Update property" : "Create property"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
          <div className="grid gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or address…"
            />
            <div className="rounded-[16px] border border-border bg-brand-soft/60 p-4 text-sm text-muted">
              Use the form to create or edit a property. The list below updates
              as soon as you save.
            </div>
          </div>
        </div>
        {formError ? <div className="mt-3 text-sm text-danger">{formError}</div> : null}
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[190px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : "No properties yet"}
          body={
            query
              ? "Nothing matched your search. Try a different title or address."
              : "Properties added to this workspace will show up here with their rent and occupancy."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="property-art h-28" />
              <div className="p-4">
                <div className="truncate text-sm font-semibold tracking-tight">
                  {p.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted">{p.address}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {formatMoney(p.rentAmount, p.currency)}
                    <span className="text-xs font-normal text-muted"> / yr</span>
                  </div>
                  {p.bedrooms != null ? (
                    <Badge tone="sand" className="shrink-0">
                      {p.bedrooms} bed{p.bedrooms === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteProperty(p.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
