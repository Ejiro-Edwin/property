import * as React from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
      {error ? <div className="text-xs text-danger">{error}</div> : null}
    </div>
  );
}

