import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-card-elevated px-4 py-3.5 text-base text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
}
