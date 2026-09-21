"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { RequirePrivileged } from "@/components/app/require-privileged";

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
  createdAt: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function PropertiesPage() {
  return (
    <RequirePrivileged>
      <PropertiesPageContent />
    </RequirePrivileged>
  );
}

function PropertiesPageContent() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [items, setItems] = React.useState<Property[] | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
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
    agentId: "",
    bedrooms: "",
    rentAmount: "",
    currency: "NGN",
  });
  const portfolioValue = items?.reduce((sum, p) => sum + p.rentAmount, 0) ?? 0;
  const avgRent =
    items && items.length > 0 ? Math.round(portfolioValue / items.length) : 0;

  const agents = members.filter((m) =>
    ["letting_agent", "landlord", "admin"].includes(m.role.toLowerCase()),
  );

  React.useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    api<{ user: { id: string } }>("auth/me", { tenantId })
      .then((r) => setCurrentUserId(r.user.id))
      .catch(() => setCurrentUserId(""));
    api<{ users: Member[] }>("users", { tenantId, query: { limit: 100 } })
      .then((r) => setMembers(r.users ?? []))
      .catch(() => setMembers([]));
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
      agentId: "",
      bedrooms: "",
      rentAmount: "",
      currency: "NGN",
    });
    setFormError(null);
  }

  function startEdit(p: Property) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      address: p.address,
      agentId: "",
      bedrooms: String(p.bedrooms ?? ""),
      rentAmount: String(p.rentAmount),
      currency: p.currency ?? "NGN",
    });
    setFormError(null);
  }

  async function submitProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      setFormError("Sign in again to create properties.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        tenantId,
        title: form.title,
        address: form.address,
        landlordId: currentUserId,
        ...(form.agentId ? { agentId: form.agentId } : {}),
        bedrooms: Number(form.bedrooms),
        rentAmount: Number(form.rentAmount),
        currency: form.currency || "NGN",
      };

      await api(editingId ? `properties/${editingId}` : "properties", {
        method: editingId ? "PATCH" : "POST",
        tenantId,
        query: { tenantId },
        body: payload,
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
    <div className="mx-auto grid w-full max-w-[1140px] gap-5 pb-8">
      <PageHeader
        eyebrow="Properties Portfolio"
        title="Your Properties"
        description="Manage and monitor your property portfolio."
        action={
          <Link href={`/t/${tenantId}/app/properties/add`}><Button className="shrink-0 bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Add property</Button></Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77716d]">Total properties</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#24211f]">
            {items === null ? "…" : total}
          </div>
          <div className="mt-1 text-xs text-[#77716d]">Properties in your portfolio</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77716d]">Occupied units</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#24211f]">
            {items === null ? "…" : `${Math.min(total, items.length)} Units`}
          </div>
          <div className="mt-1 text-xs text-[#77716d]">Across all properties</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77716d]">Vacant units</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#24211f]">
            {items === null ? "…" : `${Math.max(total - items.length, 0)} Units`}
          </div>
          <div className="mt-1 text-xs text-[#77716d]">Available for letting</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties..." />
        <Select defaultValue="all"><option value="all">All types</option><option value="apartment">Apartments</option><option value="house">Houses</option></Select>
        <Select defaultValue="all"><option value="all">All statuses</option><option value="occupied">Occupied</option><option value="vacant">Vacant</option></Select>
        <Select defaultValue="all"><option value="all">All rent</option><option value="low">Under ₦250k</option><option value="high">₦250k+</option></Select>
        <Button variant="secondary">Reset</Button>
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
            <Link key={p.id} href={`/t/${tenantId}/app/properties/${p.id}`} className="card overflow-hidden rounded-[8px] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="property-art h-28" />
              <div className="p-4">
                <div className="truncate text-sm font-semibold tracking-tight text-[#0f172a]">{p.title}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">{p.address}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-[#0f172a]">
                    {formatMoney(p.rentAmount, p.currency)}
                    <span className="text-xs font-normal text-slate-500"> / yr</span>
                  </div>
                  {p.bedrooms != null ? (
                    <Badge tone="sand" className="shrink-0">
                      {p.bedrooms} bed{p.bedrooms === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteProperty(p.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
