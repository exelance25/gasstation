"use client";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function Button({ className, loading, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "tap-fast w-full rounded-2xl bg-primary-gradient px-4 py-3.5 text-base font-semibold text-white",
        "transition-transform duration-75 active:scale-[0.98] disabled:opacity-50",
        className
      )}
      {...props}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}
