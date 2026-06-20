"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { walletService } from "@/wallets/wallet-service";

export default function ConnectedWalletsPage() {
  const snapshot = walletService.load();

  return (
    <AppShell title="Connected Wallets">
      <Card className="space-y-3 text-sm">
        <div>
          <p className="text-muted">EVM</p>
          <p>{snapshot?.evmAddress ?? "Not connected"}</p>
        </div>
        <div>
          <p className="text-muted">Solana</p>
          <p className="break-all">{snapshot?.solanaAddress ?? "Not connected"}</p>
        </div>
      </Card>
      <Link href="/wallet-connect" className="glass mt-4 block rounded-3xl p-4 text-center text-sm hover-glow">
        Manage Connections →
      </Link>
    </AppShell>
  );
}
