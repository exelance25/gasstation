"use client";

import { AppShell } from "@/components/layout/app-shell";
import { UnifiedBalanceCard } from "@/components/balance/unified-balance-card";

export default function UnifiedBalancePage() {
  return (
    <AppShell title="Unified Balance">
      <UnifiedBalanceCard />
      <p className="mt-4 text-center text-xs text-muted">
        Blockchain complexity is abstracted — you only see ONE BALANCE.
      </p>
    </AppShell>
  );
}
