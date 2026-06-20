"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAccount, useDisconnect } from "wagmi";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { walletService } from "@/wallets/wallet-service";
import { useChainGuard } from "@/hooks/use-chain-guard";

export function WalletConnectPanel() {
  const { t } = useTranslation();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const solana = useWallet();
  const { setVisible } = useWalletModal();
  const { warnings } = useChainGuard();

  const persist = () => {
    walletService.save({
      evmAddress: address,
      solanaAddress: solana.publicKey?.toBase58(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      {warnings.map((w) => (
        <motion.div
          key={w}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          {w}
        </motion.div>
      ))}

      <Card>
        <p className="mb-3 text-sm font-medium">Ethereum · Monad</p>
        <p className="mb-4 text-xs text-muted">MetaMask, WalletConnect, Trust Wallet</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
        {isConnected && (
          <div className="mt-3 space-y-2 text-xs text-muted">
            <p>{address}</p>
            <Badge>{chain?.name ?? "Unknown network"}</Badge>
            <Button
              className="mt-2 bg-white/10"
              onClick={() => {
                persist();
                disconnect();
              }}
            >
              {t("disconnect")} EVM
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium">Solana</p>
        <p className="mb-4 text-xs text-muted">Phantom, Backpack, Solflare</p>
        <Button onClick={() => setVisible(true)}>{t("connectWallet")} Solana</Button>
        {solana.connected && (
          <div className="mt-3 space-y-2 text-xs text-muted">
            <p>{solana.publicKey?.toBase58()}</p>
            <Button className="bg-white/10" onClick={() => solana.disconnect()}>
              {t("disconnect")} Solana
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
