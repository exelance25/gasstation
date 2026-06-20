import {
  createPublicClient,
  http,
  isAddress,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { getEnv, getTreasuryEvm } from "../config/env.js";

function chainForName(name: string) {
  const env = getEnv().APP_ENV;
  if (name.startsWith("base")) return env === "mainnet" ? base : baseSepolia;
  if (name.startsWith("monad")) {
    return {
      id: env === "mainnet" ? 143 : 10143,
      name: "Monad",
      nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
      rpcUrls: {
        default: {
          http: [getEnv().MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz"],
        },
      },
    };
  }
  return env === "mainnet" ? mainnet : sepolia;
}

function rpcForChain(name: string): string {
  const env = getEnv();
  if (name.startsWith("base")) {
    return env.BASE_RPC_URL ?? (env.APP_ENV === "mainnet" ? "https://mainnet.base.org" : "https://sepolia.base.org");
  }
  if (name.startsWith("monad")) {
    return env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
  }
  return env.ETH_RPC_URL ?? (env.APP_ENV === "mainnet" ? "https://ethereum-rpc.publicnode.com" : "https://ethereum-sepolia-rpc.publicnode.com");
}

/** Native token ödemesi — treasury'ye gelen transfer */
export async function verifyNativePayment(params: {
  chain: string;
  paymentTxHash: string;
  payerAddress: string;
  expectedAmountWei: bigint;
}): Promise<{ valid: boolean; reason?: string }> {
  const treasury = getTreasuryEvm();
  if (!treasury) {
    return { valid: false, reason: "TREASURY_EVM_ADDRESS yapılandırılmamış" };
  }

  const payer = params.payerAddress.trim();
  if (!isAddress(payer)) {
    return { valid: false, reason: "Geçersiz ödeme adresi" };
  }

  const chain = chainForName(params.chain);
  const client = createPublicClient({ chain, transport: http(rpcForChain(params.chain)) });

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
    return { valid: false, reason: "Ödeme PUMPSTATION kasasına gitmedi" };
  }

  if ((tx.value ?? 0n) < params.expectedAmountWei) {
    return { valid: false, reason: "Ödeme tutarı yetersiz" };
  }

  return { valid: true };
}

export function parsePaymentAmountWei(amount: string): bigint {
  return BigInt(amount);
}

export function gasAmountFromQuote(gasEstimateWei: string): number {
  return Number(BigInt(gasEstimateWei)) / 1e18;
}

export async function deliverNativeGas(params: {
  chain: string;
  beneficiaryAddress: string;
  gasAmountNative: number;
}): Promise<Hash> {
  const key = (await import("../config/env.js")).getOperatorKey();
  if (!key) throw new Error("EVM operatör anahtarı yapılandırılmamış");

  const { createWalletClient } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");

  const chain = chainForName(params.chain);
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({
    account,
    chain,
    transport: http(rpcForChain(params.chain)),
  });
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcForChain(params.chain)),
  });

  const to = params.beneficiaryAddress as Address;
  if (!isAddress(to)) throw new Error("Geçersiz beneficiary adresi");

  const value = parseEther(params.gasAmountNative.toFixed(18));
  const hash = await wallet.sendTransaction({ to, value });
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  return hash;
}
