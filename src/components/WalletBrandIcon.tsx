"use client";

import Image from "next/image";
import { getWalletIconPath } from "@/lib/wallet-icons";
import { cn } from "@/lib/utils";

type WalletBrandIconProps = {
  label: string;
  kind?: "evm" | "solana" | "phantom";
  className?: string;
};

export function WalletBrandIcon({ label, kind = "evm", className }: WalletBrandIconProps) {
  const src = getWalletIconPath(label);
  const initials = label.slice(0, 2).toUpperCase();

  if (src) {
    return (
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#141414]",
          kind === "phantom" && "ring-1 ring-purple-500/30",
          className,
        )}
      >
        <Image
          src={src}
          alt=""
          width={32}
          height={32}
          className="object-contain"
          aria-hidden
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-xs font-bold",
        kind === "solana"
          ? "bg-violet-500/15 text-violet-300"
          : "bg-emerald-500/15 text-emerald-300",
        className,
      )}
    >
      {initials}
    </span>
  );
}
