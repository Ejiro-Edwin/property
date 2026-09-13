import * as React from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-[#dfe7e3] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {eyebrow ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1f6b67]">
              {eyebrow}
            </div>
          ) : null}
          <h1
            className={cn(
              "text-[2rem] font-bold tracking-[-0.04em] text-[#0f172a]",
              eyebrow ? "mt-2" : "mt-0",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        {action ? <div className="lg:justify-self-end">{action}</div> : null}
      </div>
    </section>
  );
}
