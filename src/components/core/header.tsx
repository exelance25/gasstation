"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CoinNavLauncher } from "@/components/navigation/coin-nav-launcher";
import { OperationsDrawer } from "@/components/navigation/operations-drawer";

function OperationsIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden className="text-monad-600">
      <rect y="1" width="22" height="2" rx="1" fill="currentColor" />
      <rect y="8" width="16" height="2" rx="1" fill="currentColor" />
      <rect y="15" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const { t } = useTranslation();
  const [operationsOpen, setOperationsOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <CoinNavLauncher />
          <span className="text-lg font-bold tracking-tight text-monad-ink">TekBakiye</span>
        </div>

        <button
          type="button"
          aria-label={t("operationsMenu")}
          onClick={() => setOperationsOpen(true)}
          className="tap-fast flex h-11 w-11 items-center justify-center bg-transparent text-monad-600 hover:text-monad-500"
        >
          <OperationsIcon />
        </button>
      </header>

      <OperationsDrawer open={operationsOpen} onClose={() => setOperationsOpen(false)} />
    </>
  );
}
