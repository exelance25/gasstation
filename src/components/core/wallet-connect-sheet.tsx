"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnect, useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToastStore } from "@/stores/use-toast-store";
import { cn } from "@/lib/utils";

function EvmConnectPanel({ onSuccess }: { onSuccess: () => void }) {
  const { connectors, connect, isPending, error } = useConnect();
  const { isConnected } = useAccount();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (isConnected) onSuccess();
  }, [isConnected, onSuccess]);

  const list = connectors.filter((c) => c.name !== "Injected" || c.id === "injected").slice(0, 5);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">MetaMask, WalletConnect, Trust Wallet — Web3 bağlantı katmanı.</p>
      {list.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          disabled={isPending}
          onClick={() =>
            connect(
              { connector },
              {
                onError: () => showToast("EVM bağlantısı başarısız")
              }
            )
          }
          className={cn(
            "tap-fast flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-card px-4 py-4 text-left transition hover:border-accent/40 hover:bg-surface-hover",
            isPending && "opacity-60"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-medium text-foreground">{connector.name}</p>
            <p className="text-xs text-muted">EVM · Ethereum · Polygon · Arbitrum</p>
          </div>
        </button>
      ))}
      {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  );
}

function SolanaConnectPanel({ onSuccess }: { onSuccess: () => void }) {
  const { wallets, select, connect, connected, connecting, publicKey } = useWallet();
  const showToast = useToastStore((s) => s.show);

  const ready = wallets.filter((w) => w.readyState === "Installed" || w.readyState === "Loadable");
  const list = ready.length ? ready : wallets;

  useEffect(() => {
    if (connected && publicKey) onSuccess();
  }, [connected, publicKey, onSuccess]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Phantom, Solflare ve diğer Solana cüzdanları.</p>
      {list.slice(0, 5).map((w) => (
        <button
          key={w.adapter.name}
          type="button"
          disabled={connecting}
          onClick={async () => {
            try {
              select(w.adapter.name);
              await connect();
            } catch {
              showToast("Solana bağlantısı başarısız");
            }
          }}
          className={cn(
            "tap-fast flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-card px-4 py-4 text-left transition hover:border-accent/40",
            connecting && "opacity-60"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-medium text-foreground">{w.adapter.name}</p>
            <p className="text-xs text-muted">
              {w.readyState === "Installed" ? "Yüklü" : "Kurulum gerekli"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function WalletConnectSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const closeOnSuccess = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Cüzdan Bağla">
      <Tabs defaultValue="evm">
        <TabsList>
          <TabsTrigger value="evm">EVM Cüzdan Bağla</TabsTrigger>
          <TabsTrigger value="solana">Solana Cüzdan Bağla</TabsTrigger>
        </TabsList>
        <TabsContent value="evm">
          <EvmConnectPanel onSuccess={closeOnSuccess} />
        </TabsContent>
        <TabsContent value="solana">
          <SolanaConnectPanel onSuccess={closeOnSuccess} />
        </TabsContent>
      </Tabs>
      <Button className="mt-6 bg-card-elevated text-foreground" onClick={() => onOpenChange(false)}>
        Kapat
      </Button>
    </Sheet>
  );
}
