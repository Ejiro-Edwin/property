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
          "h-10 w-full rounded-[8px] border border-[#dfe7e3] bg-[#fbfcfc] px-3 text-sm text-slate-800 shadow-none transition-all duration-150",
          "placeholder:text-slate-400",
          "hover:border-slate-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#baff00]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

