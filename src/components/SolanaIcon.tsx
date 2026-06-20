"use client";

import { ASSET_LOGO_SRC } from "@/config/asset-logos";
import { cn } from "@/lib/utils";

type SolanaIconProps = {
  className?: string;
  active?: boolean;
};

/** Solana resmi marka logosu */
export function SolanaIcon({ className = "h-6 w-6", active = true }: SolanaIconProps) {
  return (
    <img
      src={ASSET_LOGO_SRC.SOL}
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
