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
    <section className={cn("relative border-b border-border/60 pb-5", className)}>
      <div
        className="absolute left-0 top-1 h-10 w-1 rounded-full bg-brand"
        aria-hidden
      />
      <div className="grid gap-5 pl-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {eyebrow ? (
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </div>
          ) : null}
          <h1
            className={cn(
              "text-2xl font-semibold tracking-tight sm:text-3xl",
              eyebrow ? "mt-2" : "mt-0",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="lg:justify-self-end">{action}</div> : null}
      </div>
    </section>
  );
}
