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
    "bg-brand text-brand-ink hover:bg-brand-hover active:bg-brand-hover shadow-sm",
  secondary:
    "border border-border bg-background text-foreground hover:bg-charcoal-soft active:bg-black/[0.06]",
  ghost: "bg-transparent text-foreground hover:bg-charcoal-soft active:bg-black/[0.06]",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/85 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[4px]",
  md: "h-10 px-4 text-sm rounded-[4px]",
  lg: "h-11 px-5 text-base rounded-[4px]",
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
        "inline-flex items-center justify-center gap-2 font-medium transition outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
