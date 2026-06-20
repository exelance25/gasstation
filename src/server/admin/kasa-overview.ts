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

export type TreasuryBalanceRow = {
  label: string;
  chainId?: number;
  symbol: string;
  amount: string;
  role: "collector" | "operator";
};

export type KasaOverview = {
  env: string;
  configured: {
    evmOperator: boolean;
    solanaOperator: boolean;
    collector: boolean;
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

async function readNativeBalance(
  address: Address,
  chain: Chain,
  symbol: string,
  role: "collector" | "operator",
): Promise<TreasuryBalanceRow> {
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });
  const wei = await client.getBalance({ address });
  return {
    label: getChainDisplayName(chain.id),
    chainId: chain.id,
    symbol,
    amount: formatEther(wei),
    role,
  };
}

async function readCollectorUsdc(
  collector: Address,
  chainId: number,
): Promise<TreasuryBalanceRow | null> {
  const usdc = getUsdcAddress(chainId);
  if (!usdc) return null;
  const client = createDepositPublicClient(chainId);
  const raw = (await client.readContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [collector],
  })) as bigint;
  if (raw === 0n) return null;
  return {
    label: `USDC · ${getChainDisplayName(chainId)}`,
    chainId,
    symbol: "USDC",
    amount: formatUnits(raw, 6),
    role: "collector",
  };
}

export async function getKasaOverview(): Promise<KasaOverview> {
  const collector = getCollectorAddressSafe();
  const operator = getOperatorAddressSafe();
  const balances: TreasuryBalanceRow[] = [];

  if (collector) {
    for (const chainId of DEPOSIT_EVM_CHAIN_IDS) {
      const row = await readCollectorUsdc(collector, chainId).catch(() => null);
      if (row) balances.push(row);
    }
  }

  if (operator) {
    for (const { chain, symbol } of deliveryChains()) {
      const row = await readNativeBalance(operator, chain, symbol, "operator").catch(
        () => null,
      );
      if (row) balances.push(row);
    }
  }

  const ledger = readTreasuryLedger(80);

  return {
    env: clientEnv.NEXT_PUBLIC_APP_ENV,
    configured: {
      evmOperator: isOperatorConfigured(),
      solanaOperator: isSolanaOperatorConfigured(),
      collector: Boolean(collector),
    },
    addresses: { collector, operator },
    balances,
    ledger,
    ledgerSummary: summarizeTreasuryLedger(ledger),
    recentDispenses: listRecentProcessedDeposits(40),
    openOrders: listOpenOrders(30),
    activePasses: listActivePasses(30),
  };
}
