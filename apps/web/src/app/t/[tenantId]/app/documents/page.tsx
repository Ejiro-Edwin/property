"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

type DocumentItem = { id: string; name: string; category: string; url: string; visibility: string; createdAt: string };

export default function DocumentsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<DocumentItem[] | null>(null);
  const [form, setForm] = React.useState({ name: "", category: "lease", url: "" });
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
      setForm({ name: "", category: "lease", url: "" }); await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not upload document"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
      <div><h1 className="text-2xl font-bold tracking-tight text-teal">Documents</h1><p className="mt-1 text-sm text-muted">Store and share tenancy documents securely.</p></div>
      <form className="card grid gap-4 p-6 sm:grid-cols-3" onSubmit={submit}>
        <Field label="Document name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field>
        <Field label="Storage URL"><Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required /></Field>
        <Button className="sm:col-span-3" disabled={busy}>{busy ? "Uploading…" : "Upload document"}</Button>
        {error ? <div className="text-sm text-danger sm:col-span-3">{error}</div> : null}
      </form>
      {items === null ? <div className="card p-6 text-sm text-muted">Loading documents…</div> : items.length === 0 ? <EmptyState title="No documents yet" body="Uploaded leases and tenancy records will appear here." /> : <div className="card divide-y divide-border">{items.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-black/[0.02]"><div><div className="text-sm font-semibold">{item.name}</div><div className="mt-1 text-xs text-muted">{item.category} · {item.visibility.toLowerCase()}</div></div><span className="text-sm text-teal">Open</span></a>)}</div>}
    </div>
  );
}
