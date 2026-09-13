import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full rounded-[14px] border border-slate-200 bg-[#fbfcfc] px-3.5 text-[15px] text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all duration-150",
          "placeholder:text-slate-400",
          "hover:border-slate-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#baff00]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

