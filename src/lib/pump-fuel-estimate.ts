import type { GasDeliveryAsset } from "@/config/depot-assets";

/** Ödeme + teslimat ağına göre kullanıcıya gösterilecek tahmini süre (sn) */
export function estimatePumpFuelSeconds(input: {
  depositChainId?: number;
  deliveryAsset: GasDeliveryAsset;
}): number {
  const depositBlock = depositBlockSeconds(input.depositChainId);
  const deliveryBlock = deliveryBlockSeconds(input.deliveryAsset);
  // API doğrulama + broadcast (~2sn) + iki blok onayı (paralel hissi için *0.85)
  return Math.max(8, Math.ceil((depositBlock + deliveryBlock) * 0.85 + 3));
}

function depositBlockSeconds(chainId?: number): number {
  if (!chainId) return 6;
  // Base mainnet / sepolia
  if (chainId === 8453 || chainId === 84532) return 2;
  // Monad
  if (chainId === 10143 || chainId === 143) return 1;
  // Sepolia / Ethereum
  if (chainId === 11155111 || chainId === 1) return 12;
  return 6;
}

function deliveryBlockSeconds(asset: GasDeliveryAsset): number {
  switch (asset) {
    case "BASE":
      return 2;
    case "MON":
      return 1;
    case "ETH":
      return 12;
    case "SOL":
      return 4;
    default:
      return 6;
  }
}
