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

type DocumentItem = { id: string; name: string; category: string; url: string; visibility: string; createdAt: string };

export default function DocumentsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<DocumentItem[] | null>(null);
  const [form, setForm] = React.useState({ name: "", category: "lease", url: "", visibility: "PRIVATE" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  function load() {
    return api<{ documents: DocumentItem[] }>("documents", { tenantId })
      .then((result) => setItems(result.documents ?? []))
      .catch(() => setItems([]));
  }

  React.useEffect(() => { void load(); }, [tenantId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      await api("documents", { method: "POST", tenantId, body: form });
      setForm({ name: "", category: "lease", url: "", visibility: "PRIVATE" }); await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not upload document"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
      <PageHeader
        eyebrow="Workspace files"
        title="Documents"
        description="Store and share tenancy documents securely."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Files</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">{items === null ? "…" : items.length}</div>
          <div className="mt-1 text-xs text-slate-500">Stored in workspace</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Private</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">{items === null ? "…" : items.filter((item) => item.visibility === "PRIVATE").length}</div>
          <div className="mt-1 text-xs text-slate-500">Restricted access</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Shared</div>
          <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0f172a]">{items === null ? "…" : items.filter((item) => item.visibility !== "PRIVATE").length}</div>
          <div className="mt-1 text-xs text-slate-500">Visible to workspace</div>
        </div>
      </div>

      <form className="card grid gap-4 rounded-[22px] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] sm:grid-cols-3" onSubmit={submit}>
        <Field label="Document name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field>
        <Field label="Storage URL"><Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required /></Field>
        <Field label="Visibility"><select className="h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="PRIVATE">Private</option><option value="WORKSPACE">Workspace</option></select></Field>
        <Button className="sm:col-span-3 bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]" disabled={busy}>{busy ? "Uploading…" : "Upload document"}</Button>
        {error ? <div className="text-sm text-danger sm:col-span-3">{error}</div> : null}
      </form>

      {items === null ? <div className="card rounded-[22px] p-6 text-sm text-slate-600">Loading documents…</div> : items.length === 0 ? <EmptyState title="No documents yet" body="Uploaded leases and tenancy records will appear here." /> : <div className="card divide-y divide-slate-200 rounded-[22px]">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><a href={item.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 hover:underline"><div className="text-sm font-semibold text-[#0f172a]">{item.name}</div><div className="mt-1 text-xs text-slate-500">{item.category} · {item.visibility.toLowerCase()}</div></a><div className="flex items-center gap-2"><Badge tone={item.visibility === "PRIVATE" ? "neutral" : "brand"}>{item.visibility === "PRIVATE" ? "Private" : "Shared"}</Badge><Button size="sm" variant="secondary" className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100" onClick={async () => { await api(`documents/${item.id}/visibility`, { method: "PATCH", tenantId, body: { visibility: item.visibility === "PRIVATE" ? "WORKSPACE" : "PRIVATE" } }); await load(); }}>{item.visibility === "PRIVATE" ? "Share" : "Private"}</Button><Button size="sm" variant="danger" onClick={async () => { if (confirm("Delete this document?")) { await api(`documents/${item.id}`, { method: "DELETE", tenantId }); await load(); } }}>Delete</Button></div></div>)}</div>}
    </div>
  );
}
