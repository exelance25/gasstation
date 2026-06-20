import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-2xl bg-shimmer bg-[length:200%_100%] bg-card",
        className
      )}
    />
  );
}
