import "server-only";

import { decodeEventLog, formatEther, formatUnits, parseAbiItem, type Address, type Hash } from "viem";
import { getLivePrices } from "@/lib/oracle/live-prices";
import {
  computeNativePaymentWei,
  nativePaySymbolForChain,
  usdPriceForPaySymbol,
} from "@/lib/manual-payment";
import { roundPackageUsd, type AmountOption } from "@/lib/pricing";
import { getUsdcAddress } from "@config/evm-chains";
import { getServerCollectorAddress } from "@/config/operator-env";
import { createDepositPublicClient } from "@/server/gas/verify-usdc-deposit";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type UsdcDepositRead = {
  kind: "usdc";
  from: Address;
  packageUsd: AmountOption;
};

export type NativeDepositRead = {
  kind: "native";
  from: Address;
  amountWei: bigint;
  paySymbol: "ETH" | "BASE" | "MON";
  packageUsd: AmountOption;
};

export async function readExactUsdcDepositFromTx(
  txHash: Hash,
  chainId: number,
): Promise<UsdcDepositRead | null> {
  const usdc = getUsdcAddress(chainId);
  if (!usdc) return null;

  const treasury = getServerCollectorAddress();
  const client = createDepositPublicClient(chainId);
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") return null;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args;
      if (to.toLowerCase() !== treasury.toLowerCase()) continue;
      return {
        kind: "usdc",
        from,
        packageUsd: roundPackageUsd(Number(formatUnits(value, 6))),
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function inferPackageUsdFromNativeWei(
  amountWei: bigint,
  paySymbol: "ETH" | "BASE" | "MON",
  prices: Awaited<ReturnType<typeof getLivePrices>>,
): AmountOption {
  const nativeAmount = Number(formatEther(amountWei));
  const price = usdPriceForPaySymbol(paySymbol, prices);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return roundPackageUsd(nativeAmount * price);
}

export async function readExactNativeDepositFromTx(
  txHash: Hash,
  chainId: number,
): Promise<NativeDepositRead | null> {
  const paySymbol = nativePaySymbolForChain(chainId);
  if (!paySymbol) return null;

  const treasury = getServerCollectorAddress();
  const client = createDepositPublicClient(chainId);
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") return null;

  const tx = await client.getTransaction({ hash: txHash }).catch(() => null);
  if (!tx || tx.value <= 0n) return null;
  if (tx.to?.toLowerCase() !== treasury.toLowerCase()) return null;

  const prices = await getLivePrices();
  return {
    kind: "native",
    from: tx.from,
    amountWei: tx.value,
    paySymbol,
    packageUsd: inferPackageUsdFromNativeWei(tx.value, paySymbol, prices),
  };
}

/** USDC veya native treasury transferini okur */
export async function readAnyTreasuryDepositFromTx(
  txHash: Hash,
  chainId: number,
): Promise<UsdcDepositRead | NativeDepositRead | null> {
  const usdc = await readExactUsdcDepositFromTx(txHash, chainId);
  if (usdc) return usdc;
  return readExactNativeDepositFromTx(txHash, chainId);
}

export async function resolvePackageUsdForNativeDeposit(params: {
  txHash: Hash;
  chainId: number;
  hintedPackageUsd?: AmountOption;
}): Promise<{ from: Address; packageUsd: AmountOption; paySymbol: "ETH" | "BASE" | "MON" } | null> {
  const native = await readExactNativeDepositFromTx(params.txHash, params.chainId);
  if (!native || native.packageUsd <= 0) return null;

  const prices = await getLivePrices();
  const candidates = new Set<AmountOption>();
  if (params.hintedPackageUsd != null && params.hintedPackageUsd > 0) {
    candidates.add(roundPackageUsd(params.hintedPackageUsd));
  }
  candidates.add(native.packageUsd);

  for (const packageUsd of candidates) {
    const expectedWei = computeNativePaymentWei(packageUsd, native.paySymbol, prices);
    const tolerance =
      process.env.NEXT_PUBLIC_APP_ENV === "mainnet" ? expectedWei / 100n : expectedWei / 20n;
    const minWei = expectedWei > tolerance ? expectedWei - tolerance : 0n;
    if (native.amountWei >= minWei) {
      return { from: native.from, packageUsd, paySymbol: native.paySymbol };
    }
  }

  return { from: native.from, packageUsd: native.packageUsd, paySymbol: native.paySymbol };
}
