import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import {
  CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  USDC_BY_CHAIN,
  USDC_DECIMALS,
  erc20TransferAbi,
  type PaymentChain,
} from "../types/order.js";
import { getEnv, getOperatorKey, isMainnet } from "../config/env.js";

function getChainId(paymentChain: PaymentChain): number {
  return isMainnet() ? CHAIN_IDS[paymentChain] : TESTNET_CHAIN_IDS[paymentChain];
}

function getChain(paymentChain: PaymentChain) {
  const id = getChainId(paymentChain);
  const chains = [mainnet, sepolia, base, baseSepolia] as const;
  const found = chains.find((c) => c.id === id);
  if (found) return found;
  return isMainnet()
    ? { id: 143, name: "Monad", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [getEnv().MONAD_RPC_URL ?? "https://rpc.monad.xyz"] } } }
    : { id: 10143, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [getEnv().MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz"] } } };
}

function getRpcUrl(paymentChain: PaymentChain): string {
  const env = getEnv();
  switch (paymentChain) {
    case "ethereum":
      return env.ETH_RPC_URL ?? (isMainnet() ? "https://ethereum-rpc.publicnode.com" : "https://ethereum-sepolia-rpc.publicnode.com");
    case "base":
      return env.BASE_RPC_URL ?? (isMainnet() ? "https://mainnet.base.org" : "https://sepolia.base.org");
    case "monad":
      return env.MONAD_RPC_URL ?? (isMainnet() ? "https://rpc.monad.xyz" : "https://testnet-rpc.monad.xyz");
  }
}

export function createEvmClient(paymentChain: PaymentChain) {
  const chain = getChain(paymentChain);
  const rpc = getRpcUrl(paymentChain);
  return createPublicClient({ chain, transport: http(rpc) });
}

export async function checkUsdcDeposit(params: {
  paymentChain: PaymentChain;
  depositAddress: string;
  expectedAmount: number;
  fromBlock?: bigint;
}): Promise<{ found: boolean; txHash?: string; amount?: number }> {
  const chainId = getChainId(params.paymentChain);
  const usdc = USDC_BY_CHAIN[chainId];
  if (!usdc) return { found: false };

  const client = createEvmClient(params.paymentChain);
  const expected = parseUnits(String(params.expectedAmount), USDC_DECIMALS);
  const deposit = params.depositAddress.toLowerCase() as Address;

  const latest = await client.getBlockNumber();
  const fromBlock = params.fromBlock ?? (latest > 5000n ? latest - 5000n : 0n);

  const logs = await client.getLogs({
    address: usdc,
    event: erc20TransferAbi[0],
    args: { to: deposit },
    fromBlock,
    toBlock: latest,
  });

  for (const log of logs) {
    const value = log.args.value;
    if (value === expected) {
      return {
        found: true,
        txHash: log.transactionHash,
        amount: params.expectedAmount,
      };
    }
  }
  return { found: false };
}

export async function sendEvmNativeGas(params: {
  chain: "ethereum" | "base" | "monad";
  to: Address;
  amount: number;
  asset: "ETH" | "BASE" | "MON";
}): Promise<Hash> {
  const key = getOperatorKey();
  if (!key) throw new Error("EVM operatör anahtarı yapılandırılmamış");

  const chain = getChain(params.chain);
  const rpc = getRpcUrl(params.chain);
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ account, chain, transport: http(rpc) });
  const publicClient = createPublicClient({ chain, transport: http(rpc) });

  const value = parseUnits(params.amount.toFixed(18), 18);
  const hash = await wallet.sendTransaction({ to: params.to, value });
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  return hash;
}
