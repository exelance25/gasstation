import type { DepotAssetId } from "@/config/depot-assets";
import { clientEnv } from "@/config/client-env";

const mainnet = clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet";

export function getDeliveryExplorerUrl(asset: DepotAssetId, txHash: string): string {
  switch (asset) {
    case "ETH":
      return mainnet
        ? `https://etherscan.io/tx/${txHash}`
        : `https://sepolia.etherscan.io/tx/${txHash}`;
    case "BASE":
      return mainnet
        ? `https://basescan.org/tx/${txHash}`
        : `https://sepolia.basescan.org/tx/${txHash}`;
    case "MON":
      return mainnet
        ? `https://monadexplorer.com/tx/${txHash}`
        : `https://testnet.monadexplorer.com/tx/${txHash}`;
    case "SOL":
      return mainnet
        ? `https://solscan.io/tx/${txHash}`
        : `https://solscan.io/tx/${txHash}?cluster=devnet`;
    default:
      return txHash;
  }
}

export function getDeliveryNetworkLabel(asset: DepotAssetId): string {
  switch (asset) {
    case "ETH":
      return mainnet ? "Ethereum" : "Ethereum Sepolia";
    case "BASE":
      return mainnet ? "Base" : "Base Sepolia";
    case "MON":
      return mainnet ? "Monad" : "Monad Testnet";
    case "SOL":
      return mainnet ? "Solana" : "Solana Devnet";
    case "ARB":
      return mainnet ? "Arbitrum One" : "Arbitrum Sepolia";
    case "BTC":
      return "Bitcoin";
    default:
      return asset;
  }
}
