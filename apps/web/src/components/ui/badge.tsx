import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "sand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-black/6 text-foreground",
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  sand: "bg-sand text-sand-ink",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function paymentStatusTone(status: string): BadgeTone {
  switch (status?.toLowerCase()) {
    case "paid":
      return "success";
    case "pending":
      return "sand";
    case "partial":
      return "warning";
    case "late":
      return "warning";
    case "missed":
      return "danger";
    default:
      return "neutral";
  }
}

export function tenancyStatusTone(status: string): BadgeTone {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "pending":
      return "sand";
    case "ended":
      return "neutral";
    default:
      return "neutral";
  }
}
