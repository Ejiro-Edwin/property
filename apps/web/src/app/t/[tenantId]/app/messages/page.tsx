"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

type Message = { id: string; body: string; read: boolean; createdAt: string; sender?: { name: string } };

export default function MessagesPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<Message[] | null>(null);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function load() { return api<{ messages: Message[] }>("messages", { tenantId }).then((result) => setItems(result.messages ?? [])).catch(() => setItems([])); }
  React.useEffect(() => { void load(); }, [tenantId]);
  async function send(event: React.FormEvent) { event.preventDefault(); if (!body.trim()) return; setError(null); try { await api("messages", { method: "POST", tenantId, body: { body: body.trim() } }); setBody(""); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not send message"); } }

  return <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8"><div><h1 className="text-2xl font-bold tracking-tight text-teal">Messages</h1><p className="mt-1 text-sm text-muted">Keep tenancy conversations in one place.</p></div>{items === null ? <div className="card p-6 text-sm text-muted">Loading messages…</div> : items.length === 0 ? <EmptyState title="No messages yet" body="Messages from your workspace will appear here." /> : <div className="card divide-y divide-border">{items.map((item) => <div key={item.id} className="px-5 py-4"><div className="text-sm">{item.body}</div><div className="mt-1 text-xs text-muted">{item.sender?.name ?? "Workspace"} · {new Date(item.createdAt).toLocaleString()}</div></div>)}</div>}<form className="card flex gap-3 p-4" onSubmit={send}><Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" aria-label="Message" /><Button>Send</Button></form>{error ? <div className="text-sm text-danger">{error}</div> : null}</div>;
}
