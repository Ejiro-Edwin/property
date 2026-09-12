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
        "rounded-[22px] border border-[#dfe7e3] bg-white/85 px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm",
        className,
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {eyebrow ? (
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f6b67]">
              {eyebrow}
            </div>
          ) : null}
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl",
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
