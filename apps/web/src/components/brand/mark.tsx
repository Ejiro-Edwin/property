import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand text-sm font-bold tracking-tight text-white shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      T
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-base font-bold tracking-tight text-foreground",
        className,
      )}
    >
      TENANTSEA
    </span>
  );
}
