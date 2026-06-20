"use client";

import type { CheckoutAssetId } from "@/config/checkout-assets";
import type { DepotAssetId } from "@/config/depot-assets";
import { ASSET_LOGO_SRC } from "@/config/asset-logos";
import { cn } from "@/lib/utils";

type AssetIconProps = {
  id: CheckoutAssetId | DepotAssetId;
  className?: string;
  active?: boolean;
};

const GLOW_RING: Partial<Record<CheckoutAssetId | DepotAssetId, string>> = {
  MON: "ring-[#836EF9]/50 shadow-[0_0_12px_rgba(131,110,249,0.45)]",
  SOL: "ring-[#14F195]/40 shadow-[0_0_12px_rgba(20,241,149,0.35)]",
  BASE: "ring-[#0052FF]/45 shadow-[0_0_12px_rgba(0,82,255,0.4)]",
  ARB: "ring-[#28A0F0]/40 shadow-[0_0_12px_rgba(40,160,240,0.35)]",
  BTC: "ring-[#F7931A]/40 shadow-[0_0_12px_rgba(247,147,26,0.35)]",
};

/** Gas / ödeme token logoları — canlı SVG + CDN */
export function AssetIcon({ id, className = "h-6 w-6", active = true }: AssetIconProps) {
  const src = ASSET_LOGO_SRC[id];
  const isLocalSvg = src.startsWith("/assets/");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        active && GLOW_RING[id],
        !active && "opacity-60",
      )}
    >
      <img
        src={src}
        alt=""
        width={28}
        height={28}
        className={cn(
          "shrink-0 object-contain",
          isLocalSvg ? "rounded-md" : "rounded-full",
          className,
        )}
        aria-hidden
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
