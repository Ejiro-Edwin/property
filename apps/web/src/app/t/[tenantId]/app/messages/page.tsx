"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

type Message = { id: string; body: string; read: boolean; createdAt: string; sender?: { name: string } };

export default function MessagesPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [items, setItems] = React.useState<Message[] | null>(null);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function load() {
    return api<{ messages: Message[] }>("messages", { tenantId })
      .then((result) => setItems(result.messages ?? []))
      .catch(() => setItems([]));
  }

  React.useEffect(() => { void load(); }, [tenantId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setError(null);
    try {
      await api("messages", { method: "POST", tenantId, body: { body: body.trim() } });
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send message");
    }
  }

  const unreadCount = items?.filter((item) => !item.read).length ?? 0;

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <PageHeader
        title="Messages"
        description="Keep tenancy conversations in one place."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{items === null ? "…" : items.length}</div>
          <div className="mt-1 text-xs text-slate-500">Conversation history</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Unread</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">{items === null ? "…" : unreadCount}</div>
          <div className="mt-1 text-xs text-slate-500">Needs a reply</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-[#0f172a]">Workspace</div>
          <div className="mt-1 text-xs text-slate-500">Shared room</div>
        </div>
      </div>

      {items === null ? (
        <div className="card rounded-[22px] p-6 text-sm text-slate-600">Loading messages…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No messages yet" body="Messages from your workspace will appear here." />
      ) : (
        <div className="card divide-y divide-slate-200 rounded-[22px]">
          {items.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-6 text-[#0f172a]">{item.body}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.sender?.name ?? "Workspace"} · {new Date(item.createdAt).toLocaleString()}</div>
                </div>
                {!item.read ? <Badge tone="brand">Unread</Badge> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="card flex flex-col gap-3 rounded-[22px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row" onSubmit={send}>
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" aria-label="Message" className="flex-1" />
        <Button className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Send</Button>
      </form>
      {error ? <div className="text-sm text-danger">{error}</div> : null}
    </div>
  );
}

