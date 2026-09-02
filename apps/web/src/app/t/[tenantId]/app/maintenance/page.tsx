"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

type RequestItem = { id: string; title: string; description: string; status: string; priority: string };

export default function MaintenancePage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<RequestItem[] | null>(null);
  const [form, setForm] = React.useState({ title: "", description: "", priority: "normal" });
  const [error, setError] = React.useState<string | null>(null);
  function load() { return api<{ requests: RequestItem[] }>("maintenance", { tenantId }).then((result) => setItems(result.requests ?? [])).catch(() => setItems([])); }
  React.useEffect(() => { void load(); }, [tenantId]);
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(null); try { await api("maintenance", { method: "POST", tenantId, body: form }); setForm({ title: "", description: "", priority: "normal" }); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not submit request"); } }
  return <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8"><div><h1 className="text-2xl font-bold tracking-tight text-teal">Maintenance</h1><p className="mt-1 text-sm text-muted">Report issues and track their progress.</p></div><form className="card grid gap-4 p-6 sm:grid-cols-2" onSubmit={submit}><Field label="Issue"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Priority"><select className="h-10 rounded-[10px] border border-border bg-background px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></Field><Field label="Description"><textarea className="min-h-24 rounded-[10px] border border-border bg-background px-3 py-2 text-sm sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field><Button className="sm:col-span-2">Submit request</Button></form>{error ? <div className="text-sm text-danger">{error}</div> : null}{items === null ? <div className="card p-6 text-sm text-muted">Loading requests…</div> : items.length === 0 ? <EmptyState title="No maintenance requests" body="Reported issues will appear here with their status." /> : <div className="card divide-y divide-border">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><div className="text-sm font-semibold">{item.title}</div><div className="mt-1 text-xs text-muted">{item.description}</div></div><div className="text-right text-xs"><div className="font-semibold capitalize text-teal">{item.status.replace("_", " ")}</div><div className="mt-1 capitalize text-muted">{item.priority}</div></div></div>)}</div>}</div>;
}
