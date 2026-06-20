"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTekBakiyeStore } from "@/lib/store";
import type { ConnectedWallet } from "@/lib/store";

function WalletRow({ wallet }: { wallet: ConnectedWallet }) {
  const removeWallet = useTekBakiyeStore((s) => s.removeWallet);
  const updateWalletNickname = useTekBakiyeStore((s) => s.updateWalletNickname);
  const [nickname, setNickname] = useState(wallet.nickname ?? "");
  const [editing, setEditing] = useState(false);

  const saveNickname = () => {
    updateWalletNickname(wallet.address, wallet.chain, nickname.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{wallet.walletName}</p>
            <Badge variant={wallet.chain === "evm" ? "default" : "success"}>
              {wallet.chain === "evm" ? "EVM" : "SOL"}
            </Badge>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-muted">{wallet.address}</p>
        </div>
        <button
          type="button"
          aria-label="Cüzdanı kaldır"
          onClick={() => removeWallet(wallet.address, wallet.chain)}
          className="tap-fast rounded-xl bg-red-500/15 p-2.5 text-red-400 hover:bg-red-500/25"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3">
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Takma ad (ör. Ana cüzdan)"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveNickname()}
            />
            <Button className="w-auto shrink-0 px-4" onClick={saveNickname}>
              Kaydet
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-left text-sm text-accent underline-offset-2 hover:underline"
          >
            {nickname || "Takma ad ekle…"}
          </button>
        )}
      </div>
    </div>
  );
}

export function WalletManageSheet({
  open,
  onOpenChange,
  onConnect
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}) {
  const wallets = useTekBakiyeStore((s) => s.connectedWallets);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Cüzdanları Yönet">
      <p className="mb-4 text-sm text-muted">
        Bağlı cüzdanlar GASSTATION üzerinden tek bakiyede birleştirilir.
      </p>
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        {wallets.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center">
            <p className="text-sm text-muted">Henüz cüzdan bağlı değil.</p>
            <Button className="mt-4" onClick={onConnect}>
              Cüzdan Bağla
            </Button>
          </div>
        ) : (
          wallets.map((w) => <WalletRow key={`${w.chain}-${w.address}`} wallet={w} />)
        )}
      </div>
      {wallets.length > 0 && (
        <>
          <Separator className="my-4" />
          <Button onClick={onConnect}>+ Yeni Cüzdan Bağla</Button>
        </>
      )}
    </Sheet>
  );
}
