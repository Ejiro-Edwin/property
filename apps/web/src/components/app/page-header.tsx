import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative border-b border-border/60 pb-5", className)}>
      <div className="absolute left-0 top-1 h-10 w-1 rounded-full bg-gradient-to-b from-brand via-brand/50 to-sand" />
      <div className="grid gap-5 pl-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
            Workspace overview
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
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
