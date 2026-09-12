import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg className={cn("h-9 w-9 shrink-0 text-teal", className)} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="15" cy="12" r="5" stroke="currentColor" strokeWidth="2.8" />
      <path d="M5 29c1.2-6 4.4-9 10-9s8.8 3 10 9" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="28" cy="14" r="4" stroke="currentColor" strokeWidth="2.8" />
      <path d="M26 22c4.8.4 7.7 3 9 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-base font-bold tracking-tight text-teal",
        className,
      )}
    >
      TENANTSEA
    </span>
  );
}
