import type { DepotAssetId } from "@/config/depot-assets";
import {
  arcTestnet,
  monadMainnet,
  monadTestnet,
} from "@config/evm-chains";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

/** USDC ödeme ağı → varsayılan gas teslim tokenı */
export function defaultDeliveryAssetForDepositChain(chainId: number): DepotAssetId {
  if (chainId === sepolia.id || chainId === mainnet.id) return "ETH";
  if (chainId === baseSepolia.id || chainId === base.id) return "BASE";
  if (chainId === monadTestnet.id || chainId === monadMainnet.id) return "MON";
  if (chainId === arcTestnet.id) return "ETH";
  return "ETH";
}

export function deliveryAssetHintForDepositChain(chainId: number): string {
  const asset = defaultDeliveryAssetForDepositChain(chainId);
  switch (asset) {
    case "ETH":
      return "Ethereum ağından ödeme → gas ETH (Sepolia/Mainnet) olarak gider";
    case "BASE":
      return "Base ağından ödeme → gas BASE olarak gider";
    case "MON":
      return "Monad ağından ödeme → gas MON olarak gider";
    default:
      return "Solana ödemesi → gas SOL olarak gider";
  }
}
