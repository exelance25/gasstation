"use client";

import type { DepotAssetId } from "@/config/depot-assets";
import { useWalletContext } from "@/providers/WalletContext";

type HybridConnectProps = {
  deliveryAsset: DepotAssetId;
};

/** Hibrit cüzdan — her tıklamada önbellek temizlenir, hesap seçimi zorunlu */
export function HybridConnect({ deliveryAsset }: HybridConnectProps) {
  const {
    connectForAsset,
    disconnectAllWallets,
    evmConnected,
    evmAddress,
    solanaConnected,
    solanaAddress,
    isDeliveryFamily,
  } = useWalletContext();

  const family = isDeliveryFamily(deliveryAsset);
  const isSol = family === "solana";
  const connected = isSol ? solanaConnected : evmConnected;
  const displayAddr = isSol
    ? solanaAddress
      ? `${solanaAddress.slice(0, 6)}…${solanaAddress.slice(-4)}`
      : null
    : evmAddress
      ? `${evmAddress.slice(0, 6)}…${evmAddress.slice(-4)}`
      : null;

  const label = connected
    ? `${displayAddr} · Bağlı`
    : isSol
      ? "Solana Cüzdan Bağla"
      : "Cüzdan Bağla";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void connectForAsset(deliveryAsset)}
        className="w-full rounded-2xl bg-emerald-950/25 px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.15),0_8px_24px_rgba(0,0,0,0.3)] transition hover:bg-emerald-950/40"
      >
        {label}
      </button>
      {connected ? (
        <button
          type="button"
          onClick={() => void disconnectAllWallets()}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 transition hover:border-red-500/30 hover:text-red-300/90"
        >
          Bağlantıyı Kes
        </button>
      ) : null}
    </div>
  );
}

/** @deprecated HybridConnect kullanın */
export function UniversalConnect({ deliveryAsset = "ETH" }: { deliveryAsset?: DepotAssetId }) {
  return <HybridConnect deliveryAsset={deliveryAsset} />;
}
