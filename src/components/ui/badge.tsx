import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}) {
  const styles = {
    default: "bg-primary/15 text-primary-dark",
    success: "bg-emerald-500/20 text-emerald-300",
    warning: "bg-amber-500/20 text-amber-300",
    danger: "bg-red-500/20 text-red-300"
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", styles[variant], className)}>
      {children}
    </span>
  );
}
