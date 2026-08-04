"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-[12px] border border-border bg-charcoal-soft p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-[10px] px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
