import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#baff00]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
