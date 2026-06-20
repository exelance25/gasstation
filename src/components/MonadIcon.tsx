"use client";

import { ASSET_LOGO_SRC } from "@/config/asset-logos";
import { cn } from "@/lib/utils";

type MonadIconProps = {
  className?: string;
  active?: boolean;
};

/** Monad resmi marka logosu */
export function MonadIcon({ className = "h-6 w-6", active = true }: MonadIconProps) {
  return (
    <img
      src={ASSET_LOGO_SRC.MON}
      alt=""
      width={24}
      height={24}
      className={cn("shrink-0 object-contain", className, !active && "opacity-55")}
      aria-hidden
      loading="lazy"
      decoding="async"
    />
  );
}
