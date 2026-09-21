import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg className={cn("h-9 w-9 shrink-0", className)} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#E5F4FB" stroke="#D4E6ED" />
      <circle cx="20" cy="20" r="8" fill="#1399D8" />
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
