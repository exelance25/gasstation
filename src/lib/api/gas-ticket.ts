import type { DepotAssetId } from "@/config/depot-assets";
import type { PaySymbol } from "@/config/payment-assets";
import type { AmountOption } from "@/lib/pricing";

export type PumpPassResponse = {
  passId: string;
  walletAddress: string;
  expiresAt: number;
  expiresInSec: number;
};

export async function issuePumpPass(walletAddress: string): Promise<PumpPassResponse> {
  const res = await fetch("/api/gas/pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  const data = await res.json();
  if (!res.ok || !data.passId) {
    throw new Error(data.error ?? "Giriş bileti oluşturulamadı");
  }
  return data as PumpPassResponse;
}

export async function fetchPumpPass(walletAddress: string): Promise<PumpPassResponse | null> {
  const res = await fetch(`/api/gas/pass?wallet=${encodeURIComponent(walletAddress)}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) return null;
  return (data.pass as PumpPassResponse | null) ?? null;
}

export async function postGasOrder(payload: {
  passId: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
  paySymbol: PaySymbol;
  paymentMode: "usdc" | "native";
}): Promise<{ orderId: string; passId: string; expiresInSec: number }> {
  const res = await fetch("/api/gas/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.orderId) {
    throw new Error(data.error ?? "Gas sipariş fişi oluşturulamadı");
  }
  return {
    orderId: data.orderId,
    passId: data.passId,
    expiresInSec: data.expiresInSec ?? 1800,
  };
}
