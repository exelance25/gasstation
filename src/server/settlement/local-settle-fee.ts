import "server-only";

import {
  createPublicClient,
  http,
  isAddress,
  type Address,
  type Chain,
  type Hash,
  type Transport,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { monadMainnet, monadTestnet } from "@config/evm-chains";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { getServerCollectorAddress } from "@/config/operator-env";
import {
  dispenseEvmNativeGas,
  getDeliveryChain,
} from "@/server/gas/dispense-evm-gas";
import { dispenseSolanaGas } from "@/server/gas/dispense-solana-gas";
import {
  isTxHashAlreadyProcessed,
  markDepositProcessed,
} from "@/server/gas/dispense-idempotency";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";

export type LocalSettleFeeRequest = {
  quoteId: string;
  chain: string;
  paymentToken: "ETH" | "MON" | "BASE" | "SOL";
  gasEstimateWei: string;
  paymentAmount: string;
  expiresAt: string;
  signature?: string | null;
  paymentTxHash: string;
  payerAddress: string;
  beneficiaryAddress: string;
};

export type LocalSettleFeeResponse = {
  settlementId: string;
  quoteId: string;
  status: "GAS_DELIVERED";
  paymentTxHash: string;
  deliveryTxHash: string;
  beneficiaryAddress: string;
  gasDeliveredWei: string;
  message: string;
};

function isMainnetEnv(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet";
}

function deliveryAssetFromChain(chain: string): GasDeliveryAsset {
  if (chain.startsWith("monad")) return "MON";
  if (chain.startsWith("solana")) return "SOL";
  if (chain.startsWith("base")) return "BASE";
  return "ETH";
}

function evmChainForName(name: string): Chain {
  if (name.startsWith("base")) return isMainnetEnv() ? base : baseSepolia;
  if (name.startsWith("monad")) return isMainnetEnv() ? monadMainnet : monadTestnet;
  return isMainnetEnv() ? mainnet : sepolia;
}

function rpcForEvmChain(name: string): string {
  if (name.startsWith("base")) {
    return isMainnetEnv()
      ? (process.env.BASE_RPC_PRIVATE_URL ??
          process.env.NEXT_PUBLIC_BASE_RPC ??
          "https://mainnet.base.org")
      : (process.env.BASE_RPC_PRIVATE_URL ??
          process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ??
          "https://sepolia.base.org");
  }
  if (name.startsWith("monad")) {
    return (
      process.env.MONAD_RPC_PRIVATE_URL ??
      process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ??
      "https://testnet-rpc.monad.xyz"
    );
  }
  return isMainnetEnv()
    ? (process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_MAINNET_RPC ??
        "https://ethereum-rpc.publicnode.com")
    : (process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ??
        "https://ethereum-sepolia-rpc.publicnode.com");
}

function paymentChainForToken(
  token: LocalSettleFeeRequest["paymentToken"],
): string {
  switch (token) {
    case "MON":
      return isMainnetEnv() ? "monad" : "monad-testnet";
    case "BASE":
      return isMainnetEnv() ? "base" : "base-sepolia";
    case "SOL":
      return isMainnetEnv() ? "solana" : "solana-devnet";
    case "ETH":
    default:
      return isMainnetEnv() ? "ethereum" : "ethereum-sepolia";
  }
}

async function verifyEvmNativePayment(params: {
  chainName: string;
  paymentTxHash: string;
  payerAddress: string;
  expectedAmountWei: bigint;
}): Promise<{ valid: boolean; reason?: string }> {
  const treasury = getServerCollectorAddress();
  if (!treasury) {
    return { valid: false, reason: "Collector adresi yapılandırılmamış" };
  }

  const payer = params.payerAddress.trim();
  if (!isAddress(payer)) {
    return { valid: false, reason: "Geçersiz ödeme adresi" };
  }

  const chain = evmChainForName(params.chainName);
  const transport: Transport = isMonadTestnetChainId(chain.id)
    ? createMonadTestnetTransport()
    : http(rpcForEvmChain(params.chainName));
  const client = createPublicClient({ chain, transport });

  const hash = params.paymentTxHash as Hash;
  const receipt = await client.getTransactionReceipt({ hash });
  if (!receipt || receipt.status !== "success") {
    return { valid: false, reason: "Ödeme işlemi başarısız veya bulunamadı" };
  }

  const tx = await client.getTransaction({ hash });
  if (!tx) return { valid: false, reason: "İşlem bulunamadı" };

  if (tx.from.toLowerCase() !== payer.toLowerCase()) {
    return { valid: false, reason: "Ödeme gönderen eşleşmiyor" };
  }

  const to = tx.to?.toLowerCase();
  if (to !== treasury.toLowerCase()) {
    return { valid: false, reason: "Ödeme GASSTATION kasasına gitmedi" };
  }

  if ((tx.value ?? 0n) < params.expectedAmountWei) {
    return { valid: false, reason: "Ödeme tutarı yetersiz" };
  }

  return { valid: true };
}

async function verifySolanaNativePayment(params: {
  signature: string;
  payerAddress: string;
  expectedLamports: bigint;
}): Promise<{ valid: boolean; reason?: string }> {
  const treasury = process.env.SOLANA_COLLECTOR_ADDRESS?.trim();
  if (!treasury) {
    return { valid: false, reason: "Solana collector yapılandırılmamış" };
  }

  const { Connection, PublicKey } = await import("@solana/web3.js");
  const rpc =
    process.env.SOLANA_RPC_PRIVATE_URL ??
    process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC ??
    "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const tx = await connection.getTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta || tx.meta.err) {
    return { valid: false, reason: "Solana ödemesi doğrulanamadı" };
  }

  const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys;
  const payerIndex = accountKeys.findIndex(
    (key) => key.toBase58() === params.payerAddress,
  );
  if (payerIndex < 0) {
    return { valid: false, reason: "Ödeme gönderen bulunamadı" };
  }

  const treasuryIndex = accountKeys.findIndex((key) => key.toBase58() === treasury);
  if (treasuryIndex < 0) {
    return { valid: false, reason: "Ödeme kasaya gitmedi" };
  }

  const pre = tx.meta.preBalances[treasuryIndex] ?? 0;
  const post = tx.meta.postBalances[treasuryIndex] ?? 0;
  const received = BigInt(post - pre);
  if (received < params.expectedLamports) {
    return { valid: false, reason: "Solana ödeme tutarı yetersiz" };
  }

  return { valid: true };
}

export function isLocalSettleAllowed(): boolean {
  if (process.env.DISABLE_LOCAL_SETTLE_FALLBACK === "true") return false;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  return appEnv === "testnet" || appEnv === "development";
}

/** Settlement Engine kapalıyken native ödeme → gas teslimi (testnet/dev) */
export async function settleFeeLocally(
  req: LocalSettleFeeRequest,
): Promise<LocalSettleFeeResponse> {
  if (!isLocalSettleAllowed()) {
    throw new Error("Yerel settlement yalnızca testnet/dev ortamında");
  }

  if (new Date(req.expiresAt).getTime() < Date.now()) {
    throw new Error("Quote süresi dolmuş");
  }

  const paymentAsset = req.paymentToken as GasDeliveryAsset;
  const paymentChainId = getDeliveryChain(paymentAsset).id;

  if (isTxHashAlreadyProcessed(req.paymentTxHash)) {
    throw new Error("Bu ödeme işlemi zaten kullanıldı");
  }

  const expectedPayment = BigInt(req.paymentAmount);

  if (req.paymentToken === "SOL") {
    const ok = await verifySolanaNativePayment({
      signature: req.paymentTxHash,
      payerAddress: req.payerAddress,
      expectedLamports: expectedPayment,
    });
    if (!ok.valid) throw new Error(ok.reason ?? "Solana ödemesi geçersiz");
  } else {
    const ok = await verifyEvmNativePayment({
      chainName: paymentChainForToken(req.paymentToken),
      paymentTxHash: req.paymentTxHash,
      payerAddress: req.payerAddress,
      expectedAmountWei: expectedPayment,
    });
    if (!ok.valid) throw new Error(ok.reason ?? "EVM ödemesi geçersiz");
  }

  const deliveryAsset = deliveryAssetFromChain(req.chain);
  const gasNative = Number(BigInt(req.gasEstimateWei)) / 1e18;

  let deliveryTxHash: string;
  if (deliveryAsset === "SOL") {
    const result = await dispenseSolanaGas({
      targetAddress: req.beneficiaryAddress,
      solAmount: gasNative,
    });
    deliveryTxHash = result.deliveryTxHash;
  } else {
    const result = await dispenseEvmNativeGas({
      targetAsset: deliveryAsset,
      targetAddress: req.beneficiaryAddress,
      nativeAmount: gasNative,
    });
    deliveryTxHash = result.deliveryTxHash;
  }

  markDepositProcessed(paymentChainId, req.paymentTxHash as Hash, deliveryTxHash);

  return {
    settlementId: `local_${req.quoteId}`,
    quoteId: req.quoteId,
    status: "GAS_DELIVERED",
    paymentTxHash: req.paymentTxHash,
    deliveryTxHash,
    beneficiaryAddress: req.beneficiaryAddress,
    gasDeliveredWei: req.gasEstimateWei,
    message: "Gas teslim edildi (yerel settlement)",
  };
}
