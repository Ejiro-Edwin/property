import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-[14px] bg-brand-soft ring-1 ring-border flex items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <div className="h-4 w-4 rounded-full bg-brand" />
    </div>
  );
}

