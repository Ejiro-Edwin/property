"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
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

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <PageHeader
        title="Properties"
        description={items ? `${total} propert${total === 1 ? "y" : "ies"} in this workspace.` : undefined}
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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or address…"
        />
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
