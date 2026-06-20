"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/one-coin-icon";
import { OperationsDrawer } from "@/components/navigation/operations-drawer";

function HamburgerIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden>
      <rect y="1" width="22" height="2" rx="1" fill="currentColor" />
      <rect y="8" width="16" height="2" rx="1" fill="currentColor" />
      <rect y="15" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function MainHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Operations menu"
          className="tap-fast flex h-11 w-11 items-center justify-center text-accent"
          onClick={() => setDrawerOpen(true)}
        >
          <HamburgerIcon />
        </button>

        <Link href="/dashboard" className="tap-fast flex flex-1 items-center justify-center gap-2">
          <BrandLogo size="sm" />
          <span className="text-lg font-medium lowercase text-foreground">onebalance</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/transaction-history"
            className="tap-fast flex h-11 w-11 items-center justify-center text-foreground/90"
            aria-label="History"
          >
            <Clock size={22} strokeWidth={1.75} />
          </Link>
          <Link
            href="/notifications"
            className="tap-fast flex h-11 w-11 items-center justify-center text-foreground/90"
            aria-label="Search"
          >
            <Search size={22} strokeWidth={1.75} />
          </Link>
        </div>
      </header>
      <OperationsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
