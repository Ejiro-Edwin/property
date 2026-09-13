import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "sand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[#f3f4f6] text-[#374151]",
  brand: "bg-[#efffee] text-[#004b49]",
  success: "bg-[#ecfdf5] text-[#15803d]",
  warning: "bg-[#fff7ed] text-[#b45309]",
  danger: "bg-[#fef2f2] text-[#b91c1c]",
  sand: "bg-[#f5f0eb] text-[#7c5a36]",
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
