import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("card-flat relative overflow-hidden p-5", className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />
      <div className="pl-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
      </div>
    </div>
  );
}
