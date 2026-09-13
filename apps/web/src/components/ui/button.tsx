import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#baff00] text-[#0d1b1d] hover:bg-[#a9eb00] active:bg-[#9ae200] shadow-[0_10px_20px_rgba(186,255,0,0.2)]",
  secondary:
    "border border-[#dfe7e3] bg-white text-[#0f172a] hover:bg-[#f5f7f4] active:bg-[#edf2ef]",
  ghost: "bg-transparent text-[#1f2937] hover:bg-[#f5f7f4] active:bg-[#edf2ef]",
  danger:
    "bg-[#dc2626] text-white hover:bg-[#c81e1e] active:bg-[#b71d1d] shadow-[0_10px_20px_rgba(220,38,38,0.15)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[10px]",
  md: "h-11 px-4 text-sm rounded-[12px]",
  lg: "h-12 px-5 text-base rounded-[12px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#baff00]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
