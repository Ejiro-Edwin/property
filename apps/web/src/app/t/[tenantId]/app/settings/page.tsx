"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const tabs = ["profile", "security", "lease", "payment", "notifications"] as const;
type Tab = (typeof tabs)[number];
type Settings = { leasePreferences: Record<string, unknown>; paymentPreferences: Record<string, unknown>; notificationPreferences: Record<string, unknown>; privacyPreferences: Record<string, unknown> };

export default function SettingsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tab, setTab] = React.useState<Tab>("profile");
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [userId, setUserId] = React.useState("");
  const [form, setForm] = React.useState({ name: "", email: "", phone: "" });
  const [password, setPassword] = React.useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<{ user: { id: string; name: string; email: string; phone?: string } }>("auth/me", { tenantId }).then((result) => { setUserId(result.user.id); setForm({ name: result.user.name ?? "", email: result.user.email ?? "", phone: result.user.phone ?? "" }); }).catch(() => setError("Could not load your profile"));
    api<{ settings: Settings }>("settings", { tenantId }).then((result) => setSettings(result.settings)).catch(() => setSettings({ leasePreferences: {}, paymentPreferences: {}, notificationPreferences: {}, privacyPreferences: {} }));
  }, [tenantId]);

  async function saveSettings(section: keyof Settings, value: Record<string, unknown>) {
    setBusy(true); setError(null); setNotice(null);
    try { const result = await api<{ settings: Settings }>("settings", { method: "PATCH", tenantId, body: { [section]: value } }); setSettings(result.settings); setNotice("Settings saved"); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not save settings"); } finally { setBusy(false); }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setNotice(null);
    try { await api("auth/change-password", { method: "POST", tenantId, body: password }); setPassword({ currentPassword: "", newPassword: "" }); setNotice("Password updated"); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not change password"); } finally { setBusy(false); }
  }

  const notificationPrefs = settings?.notificationPreferences ?? {};
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
      <PageHeader title="Settings" description="Manage your account and workspace preferences." />

      <div className="card p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-[10px] px-3 py-2 text-sm font-semibold capitalize transition-all ${
                tab === item
                  ? "bg-[#efffee] text-[#004b49] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {item === "lease" ? "Lease preferences" : item === "payment" ? "Payment settings" : item}
            </button>
          ))}
        </div>
      </div>

      {notice ? <div className="text-sm text-success">{notice}</div> : null}
      {error ? <div className="text-sm text-danger">{error}</div> : null}

      {tab === "profile" ? (
        <section className="card max-w-2xl rounded-[8px] p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[#0f172a]">Profile settings</h2>
          <form className="mt-6 grid gap-4" onSubmit={async (event) => { event.preventDefault(); if (!userId) return; setBusy(true); try { await api(`users/${userId}`, { method: "PATCH", tenantId, body: { tenantId, name: form.name, phone: form.phone } }); setNotice("Profile saved"); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not save profile"); } finally { setBusy(false); } }}>
            <Field label="Full name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
            <Field label="Email"><Input value={form.email} disabled /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Button disabled={busy} className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Save changes</Button>
          </form>
        </section>
      ) : null}

      {tab === "security" ? (
        <section className="card max-w-2xl rounded-[8px] p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[#0f172a]">Security and privacy</h2>
          <form className="mt-6 grid gap-4" onSubmit={changePassword}>
            <Field label="Current password"><Input type="password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} required /></Field>
            <Field label="New password" hint="Use at least 8 characters."><Input type="password" minLength={8} value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} required /></Field>
            <Button disabled={busy} className="bg-[#baff00] text-[#0d1b1d] hover:bg-[#a7ea00]">Update password</Button>
          </form>
        </section>
      ) : null}

      {tab === "lease" ? <PreferenceSection title="Lease preferences" preferences={settings?.leasePreferences ?? {}} fields={["rentReminderDays", "preferredLeaseTerm"]} onSave={(value) => saveSettings("leasePreferences", value)} busy={busy} /> : null}
      {tab === "payment" ? <PreferenceSection title="Payment settings" preferences={settings?.paymentPreferences ?? {}} fields={["defaultCurrency", "autoPay"]} onSave={(value) => saveSettings("paymentPreferences", value)} busy={busy} /> : null}
      {tab === "notifications" ? (
        <section className="card max-w-2xl rounded-[8px] p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[#0f172a]">Notification preferences</h2>
          <div className="mt-6 grid gap-3">
            {["payments", "messages", "productUpdates"].map((key) => {
              const active = Boolean(notificationPrefs[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => saveSettings("notificationPreferences", { ...notificationPrefs, [key]: !active })}
                  className="flex items-center justify-between rounded-[14px] border border-[#dfe7e3] bg-white p-4 text-left text-sm font-medium text-[#0f172a] transition-colors hover:border-[#cfe4dc]"
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? "bg-[#baff00]" : "bg-slate-200"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-5" : "translate-x-1"}`} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PreferenceSection({ title, preferences, fields, onSave, busy }: { title: string; preferences: Record<string, unknown>; fields: string[]; onSave: (value: Record<string, unknown>) => void; busy: boolean }) {
  const [draft, setDraft] = React.useState(preferences);
  React.useEffect(() => setDraft(preferences), [preferences]);

  return (
    <section className="card max-w-2xl p-6">
      <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
      <div className="mt-6 grid gap-4">
        {fields.map((field) => (
          <Field key={field} label={field.replace(/([A-Z])/g, " $1")}>
            <Input value={String(draft[field] ?? "")} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
          </Field>
        ))}
        <Button disabled={busy} onClick={() => onSave(draft)}>Save preferences</Button>
      </div>
    </section>
  );
}
