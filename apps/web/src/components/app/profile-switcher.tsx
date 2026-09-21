"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { profileLabel } from "@/lib/roles";
import { ApiError } from "@/lib/api";

const PROFILE_ORDER = ["landlord", "letting_agent", "tenant", "admin"] as const;

function sortProfiles(profiles: string[]) {
  return [...profiles].sort(
    (a, b) => PROFILE_ORDER.indexOf(a as (typeof PROFILE_ORDER)[number]) - PROFILE_ORDER.indexOf(b as (typeof PROFILE_ORDER)[number]),
  );
}

export function ProfileSwitcher({
  tenantId,
  activeRole,
  profiles,
  onSwitched,
}: {
  tenantId: string;
  activeRole?: string;
  profiles: string[];
  onSwitched?: (role: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visible = sortProfiles(profiles.filter((p) => PROFILE_ORDER.includes(p as (typeof PROFILE_ORDER)[number])));
  if (visible.length === 0) {
    return null;
  }

  async function switchTo(role: string) {
    if (role === activeRole || busy) return;
    setBusy(role);
    setError(null);
    try {
      const res = await fetch("/api/auth/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, tenantId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.message ?? "Could not switch profile";
        throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
      }
      onSwitched?.(role);
      router.push(`/t/${tenantId}/app`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not switch profile");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2 px-1">
      <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#77716d]">Workspace role</div>
      <div className="flex flex-wrap gap-1 rounded-[12px] border border-[#ded8d2] bg-white p-1">
        {visible.map((role) => {
          const active = role === (activeRole ?? "").toLowerCase();
          return (
            <button
              key={role}
              type="button"
              disabled={busy !== null || visible.length === 1}
              onClick={() => switchTo(role)}
              className={cn(
                "flex-1 rounded-[10px] px-2 py-1.5 text-xs font-medium transition sm:flex-none sm:px-3 sm:text-sm",
                active
                  ? "bg-[#e2f3fb] text-[#1f1f1f] shadow-[0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-[#77716d] hover:bg-[#f4f1ed] hover:text-[#1f1f1f]",
                busy === role && "opacity-60",
              )}
            >
              {busy === role ? "…" : profileLabel(role)}
            </button>
          );
        })}
      </div>
      {error ? <div className="px-2 text-xs text-danger">{error}</div> : null}
    </div>
  );
}
