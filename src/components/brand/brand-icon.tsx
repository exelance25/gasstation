"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandStrokeIconProps = {
  icon: LucideIcon;
  size?: number;
  active?: boolean;
  className?: string;
};

/** Nav ikonları — logo altın/mor gradyanı */
export function BrandStrokeIcon({ icon: Icon, size = 26, active, className }: BrandStrokeIconProps) {
  const rawId = useId();
  const gradId = `brand-stroke-${rawId.replace(/:/g, "")}`;

  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <svg width={0} height={0} aria-hidden className="absolute">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={active ? "#FEF3C7" : "#FDE68A"} />
            <stop offset="38%" stopColor={active ? "#F59E0B" : "#D97706"} />
            <stop offset="62%" stopColor={active ? "#C4B5FD" : "#A78BFA"} />
            <stop offset="100%" stopColor={active ? "#6B4FDB" : "#5B21B6"} />
          </linearGradient>
        </defs>
      </svg>
      <Icon
        size={size}
        strokeWidth={active ? 2.4 : 2}
        stroke={`url(#${gradId})`}
        className={cn("drop-shadow-[0_2px_6px_rgba(107,79,219,0.35)]", active && "scale-105")}
        fill={active ? `url(#${gradId})` : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </span>
  );
}
