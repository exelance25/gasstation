import "server-only";



import { createPublicClient, formatEther, formatUnits, http, type Address, type Chain } from "viem";

import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

import {

  DEPOSIT_EVM_CHAIN_IDS,

  getChainDisplayName,

  getUsdcAddress,

  monadMainnet,

  monadTestnet,

} from "@config/evm-chains";

import { erc20Abi } from "@/lib/erc20-abi";

import {

  getCollectorAddressSafe,

  getOperatorAddressSafe,

  isOperatorConfigured,

  isSolanaOperatorConfigured,

} from "@/config/operator-env";

import { createDepositPublicClient } from "@/server/gas/verify-usdc-deposit";

import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";

import {

  listRecentProcessedDeposits,

  type ProcessedDepositRow,

} from "@/server/gas/dispense-idempotency";

import { listOpenOrders, type GasOrder } from "@/server/gas/gas-order";

import { listActivePasses, type PumpPass } from "@/server/gas/pump-pass";

import {

  readTreasuryLedger,

  summarizeTreasuryLedger,

  type TreasuryLedgerEntry,

} from "@/server/gas/treasury-ledger";

import { clientEnv } from "@/config/client-env";

import { getPaymentAsset } from "@/config/pool-tokens";
import { isAdminConfigured } from "@/server/admin/admin-wallet";
import { listDeliveredOrderStats } from "@/server/gas/gas-order-stats";



export type TreasuryBalanceRow = {

  label: string;

  chainId?: number;

  symbol: string;

  amount: string;

  role: "collector" | "operator";

  kind: "native" | "erc20";

};



export type KasaOverview = {

  env: string;

  configured: {

    evmOperator: boolean;

    solanaOperator: boolean;

    collector: boolean;

    admin: boolean;

  };

  addresses: {

    collector: Address | null;

    operator: Address | null;

  };

  balances: TreasuryBalanceRow[];

  ledger: TreasuryLedgerEntry[];

  ledgerSummary: ReturnType<typeof summarizeTreasuryLedger>;

  recentDispenses: ProcessedDepositRow[];

  openOrders: GasOrder[];

  activePasses: PumpPass[];

  platformStats: {
    uniqueUsers: number;
    completedTransactions: number;
    profitMarginPercent: number;
  };

};



function isMainnet(): boolean {

  return clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet";

}



function deliveryChains() {

  return isMainnet()

    ? [

        { chain: mainnet, symbol: "ETH" as const },

        { chain: base, symbol: "BASE" as const },

        { chain: monadMainnet, symbol: "MON" as const },

      ]

    : [

        { chain: sepolia, symbol: "ETH" as const },

        { chain: baseSepolia, symbol: "BASE" as const },

        { chain: monadTestnet, symbol: "MON" as const },

      ];

}



function chainTransport(chain: Chain) {

  if (isMonadTestnetChainId(chain.id)) return createMonadTestnetTransport();

  return http(chain.rpcUrls.default.http[0]);

}



async function readNativeBalance(

  address: Address,

  chain: Chain,

  symbol: string,

  role: "collector" | "operator",

): Promise<TreasuryBalanceRow> {

  const client = createPublicClient({ chain, transport: chainTransport(chain) });

  const wei = await client.getBalance({ address });

  return {

    label: `${symbol} native · ${getChainDisplayName(chain.id)}`,

    chainId: chain.id,

    symbol,

    amount: formatEther(wei),

    role,

    kind: "native",

  };

}



async function readErc20Balance(

  holder: Address,

  token: Address,

  chainId: number,

  symbol: string,

  label: string,

  role: "collector" | "operator",

  decimals: number,

): Promise<TreasuryBalanceRow> {

  const client = createDepositPublicClient(chainId);

  const raw = (await client.readContract({

    address: token,

    abi: erc20Abi,

    functionName: "balanceOf",

    args: [holder],

  })) as bigint;

  return {

    label,

    chainId,

    symbol,

    amount: formatUnits(raw, decimals),

    role,

    kind: "erc20",

  };

}



export async function getKasaOverview(): Promise<KasaOverview> {

  const collector = getCollectorAddressSafe();

  const operator = getOperatorAddressSafe();

  const balances: TreasuryBalanceRow[] = [];



  if (collector) {

    for (const chainId of DEPOSIT_EVM_CHAIN_IDS) {

      const usdc = getUsdcAddress(chainId);

      if (usdc) {

        balances.push(

          await readErc20Balance(

            collector,

            usdc,

            chainId,

            "USDC",

            `USDC · ${getChainDisplayName(chainId)} (kasa)`,

            "collector",

            6,

          ).catch(() => ({

            label: `USDC · ${getChainDisplayName(chainId)} (kasa)`,

            chainId,

            symbol: "USDC",

            amount: "0",

            role: "collector" as const,

            kind: "erc20" as const,

          })),

        );

      }

    }



    const monUsdc = getPaymentAsset("USDC");

    if (monUsdc.contractAddress && monUsdc.chainId) {

      balances.push(

        await readErc20Balance(

          collector,

          monUsdc.contractAddress,

          monUsdc.chainId,

          "USDC",

          `USDC · ${getChainDisplayName(monUsdc.chainId)} (Monad)`,

          "collector",

          monUsdc.decimals,

        ).catch(() => ({

          label: "USDC · Monad Testnet",

          chainId: monUsdc.chainId,

          symbol: "USDC",

          amount: "0",

          role: "collector" as const,

          kind: "erc20" as const,

        })),

      );

    }

  }



  const nativeTargets: Array<{ address: Address; role: "collector" | "operator" }> = [];

  if (collector) nativeTargets.push({ address: collector, role: "collector" });

  if (operator) nativeTargets.push({ address: operator, role: "operator" });



  for (const { address, role } of nativeTargets) {

    for (const { chain, symbol } of deliveryChains()) {

      balances.push(

        await readNativeBalance(address, chain, symbol, role).catch(() => ({

          label: `${symbol} native · ${getChainDisplayName(chain.id)}`,

          chainId: chain.id,

          symbol,

          amount: "0",

          role,

          kind: "native" as const,

        })),

      );

    }

  }



  if (operator) {
    for (const chainId of DEPOSIT_EVM_CHAIN_IDS) {
      const usdc = getUsdcAddress(chainId);
      if (!usdc) continue;
      balances.push(
        await readErc20Balance(
          operator,
          usdc,
          chainId,
          "USDC",
          `USDC · ${getChainDisplayName(chainId)} (gas tank)`,
          "operator",
          6,
        ).catch(() => ({
          label: `USDC · ${getChainDisplayName(chainId)} (gas tank)`,
          chainId,
          symbol: "USDC",
          amount: "0",
          role: "operator" as const,
          kind: "erc20" as const,
        })),
      );
    }
  }



  const ledger = readTreasuryLedger(80);
  const ledgerSummary = summarizeTreasuryLedger(ledger);
  const orderStats = listDeliveredOrderStats();
  const profitMarginPercent =
    ledgerSummary.totalDepositsUsd > 0
      ? (ledgerSummary.totalRetainedUsd / ledgerSummary.totalDepositsUsd) * 100
      : 0;

  return {

    env: clientEnv.NEXT_PUBLIC_APP_ENV,

    configured: {

      evmOperator: isOperatorConfigured(),

      solanaOperator: isSolanaOperatorConfigured(),

      collector: Boolean(collector),

      admin: isAdminConfigured(),

    },

    addresses: { collector, operator },

    balances,

    ledger,

    ledgerSummary,

    recentDispenses: listRecentProcessedDeposits(40),

    openOrders: listOpenOrders(30),

    activePasses: listActivePasses(30),

    platformStats: {
      uniqueUsers: orderStats.uniqueUsers,
      completedTransactions: orderStats.completedTransactions,
      profitMarginPercent,
    },

  };

}


