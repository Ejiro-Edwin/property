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
    <section className={cn("card overflow-hidden", className)}>
      <div className="relative grid gap-5 p-6 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand via-brand/50 to-sand" />
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
