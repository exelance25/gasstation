"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CoinNavLauncher } from "@/components/navigation/coin-nav-launcher";
import { OperationsDrawer } from "@/components/navigation/operations-drawer";

function OperationsIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden className="text-accent">
      <rect y="1" width="22" height="2" rx="1" fill="currentColor" />
      <rect y="8" width="16" height="2" rx="1" fill="currentColor" />
      <rect y="15" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function AppShell({
  title,
  children,
  hideNav: _hideNav
}: {
  title?: string;
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  const { t } = useTranslation();
  const [operationsOpen, setOperationsOpen] = useState(false);

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-background px-4 pb-10 pt-4">
      <header className="relative z-20 mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CoinNavLauncher />
          <span className="text-lg font-bold lowercase text-foreground">onebalance</span>
        </div>
        <button
          type="button"
          aria-label={t("operationsMenu")}
          onClick={() => setOperationsOpen(true)}
          className="tap-fast flex h-11 w-11 items-center justify-center bg-transparent text-accent"
        >
          <OperationsIcon />
        </button>
      </header>
      <OperationsDrawer open={operationsOpen} onClose={() => setOperationsOpen(false)} />
      {title && <h1 className="mb-4 text-xl font-semibold text-foreground">{title}</h1>}
      {children}
    </main>
  );
}
