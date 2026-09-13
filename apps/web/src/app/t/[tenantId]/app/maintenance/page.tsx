"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type RequestItem = { id: string; title: string; description: string; status: string; priority: string };

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("scheduled") || value.includes("resolved")) return "success" as const;
  if (value.includes("pending") || value.includes("open")) return "brand" as const;
  if (value.includes("urgent") || value.includes("high")) return "warning" as const;
  return "neutral" as const;
}

export default function MaintenancePage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<RequestItem[] | null>(null);
  const [form, setForm] = React.useState({ title: "", description: "", priority: "normal" });
  const [error, setError] = React.useState<string | null>(null);

  function load() {
    return api<{ requests: RequestItem[] }>("maintenance", { tenantId })
      .then((result) => setItems(result.requests ?? []))
      .catch(() => setItems([]));
  }

  React.useEffect(() => { void load(); }, [tenantId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api("maintenance", { method: "POST", tenantId, body: form });
      setForm({ title: "", description: "", priority: "normal" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit request");
    }
  }

  const openCount = items?.filter((item) => item.status.toLowerCase() !== "resolved").length ?? 0;
  const urgentCount = items?.filter((item) => item.priority.toLowerCase() === "urgent").length ?? 0;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
      <PageHeader
        title="Maintenance"
        description="Report issues and track their progress in one place."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Open</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{items === null ? "…" : openCount}</div>
          <div className="mt-1 text-xs text-slate-500">Active requests</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Urgent</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{items === null ? "…" : urgentCount}</div>
          <div className="mt-1 text-xs text-slate-500">Priority cases</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Requests</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{items === null ? "…" : items.length}</div>
          <div className="mt-1 text-xs text-slate-500">Tracked this month</div>
        </div>
      </div>

      <form className="card grid gap-4 rounded-[20px] p-5 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Issue">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Priority">
          <select className="h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </Field>
        <Field label="Description">
          <textarea className="min-h-24 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </Field>
        <Button className="sm:col-span-2 bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Submit request</Button>
      </form>

      {error ? <div className="text-sm text-danger">{error}</div> : null}

      {items === null ? (
        <div className="card rounded-[22px] p-6 text-sm text-slate-600">Loading requests…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No maintenance requests" body="Reported issues will appear here with their status." />
      ) : (
        <div className="card divide-y divide-slate-200 rounded-[22px]">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#0f172a]">{item.title}</div>
                <div className="mt-1 text-xs text-slate-600">{item.description}</div>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <Badge tone={statusTone(item.status)} className="capitalize">{item.status.replace(/_/g, " ")}</Badge>
                <span className="text-xs capitalize text-slate-500">{item.priority}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

