"use client";

import Link from "next/link";
import { Grid3X3, Shield } from "lucide-react";
import { OneCoinIcon } from "@/components/brand/one-coin-icon";
import { OperationsMenu } from "@/components/navigation/operations-menu";

export function TopNav() {
  return (
    <header className="mb-5 flex items-center justify-between">
      <Link href="/dashboard" className="tap-fast flex items-center gap-3">
        <OneCoinIcon className="h-9 w-9" />
        <p className="text-sm font-bold tracking-wide text-foreground">ONEBALANCE</p>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/security-center"
          className="glass tap-fast flex h-11 w-11 items-center justify-center rounded-2xl text-primary"
        >
          <Shield size={18} />
        </Link>
        <OperationsMenu
          trigger={
            <button
              type="button"
              className="glass tap-fast flex h-11 w-11 items-center justify-center rounded-2xl text-primary"
              aria-label="Operations menu"
            >
              <Grid3X3 size={18} />
            </button>
          }
        />
        <Link href="/profile" className="tap-fast relative">
          <OneCoinIcon className="h-9 w-9" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
        </Link>
      </div>
    </header>
  );
}
