/**
 * GASSTATION gas engine integration layer
 */

import {
  PumpStationClient as SdkPumpStationClient,
  PumpStationError,
  type AggregatedBalanceResult,
  type PumpStationConfig,
  type OptimalRoute,
  type TransferCurrency,
} from "@pumpstation/gas-engine";
import { clientEnv } from "@/config/client-env";
import type { ConnectedWallet } from "@/lib/store";
import type { ParsedRecipient } from "@/lib/address-parser";

export type { AggregatedBalanceResult, PumpStationConfig, OptimalRoute, TransferCurrency };
export { PumpStationError };

let singleton: SdkPumpStationClient | null = null;

export function createPumpStationClient(config?: PumpStationConfig): SdkPumpStationClient {
  const isServer = typeof window === "undefined";
  const settlementUrl =
    config?.settlementUrl ??
    (isServer
      ? process.env.SETTLEMENT_ENGINE_URL ?? "http://localhost:4200"
      : `${clientEnv.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}`);

  return new SdkPumpStationClient({
    apiUrl: config?.apiUrl ?? clientEnv.NEXT_PUBLIC_API_BASE_URL,
    settlementUrl,
    apiKey: config?.apiKey ?? (isServer ? process.env.SETTLEMENT_API_KEY : undefined),
    environment:
      clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet"
        ? "production"
        : clientEnv.NEXT_PUBLIC_APP_ENV === "staging"
          ? "staging"
          : "development",
    ...config,
  });
}

export function getPumpStationClient(): SdkPumpStationClient {
  if (!singleton) {
    singleton = createPumpStationClient();
  }
  return singleton;
}

export async function getAggregatedBalance(addresses: string[]): Promise<AggregatedBalanceResult> {
  const client = getPumpStationClient();
  return client.getAggregatedBalance(addresses.length ? addresses : ["demo-wallet"]);
}

export async function getAggregatedBalanceFromWallets(
  wallets: ConnectedWallet[],
): Promise<AggregatedBalanceResult> {
  return getAggregatedBalance(wallets.map((w) => w.address));
}

export type BalanceSyncCallbacks = {
  onLoading: (isLoading: boolean) => void;
  onBalance: (totalUsd: number | null) => void;
};

export async function fetchAndApplyAggregatedBalance(
  wallets: ConnectedWallet[],
  callbacks: BalanceSyncCallbacks,
  options?: { silent?: boolean },
): Promise<void> {
  if (!options?.silent) callbacks.onLoading(true);
  try {
    const result = await getAggregatedBalanceFromWallets(wallets);
    callbacks.onBalance(result.totalUsd);
  } catch {
    callbacks.onBalance(null);
  } finally {
    if (!options?.silent) callbacks.onLoading(false);
  }
}

const CURRENCY_USD_RATE: Record<TransferCurrency, number> = {
  USDC: 1,
  ETH: 3500,
  SOL: 150,
};

export function amountToUsd(amount: number, currency: TransferCurrency): number {
  return amount * CURRENCY_USD_RATE[currency];
}

export function mapTransferError(error: unknown): string {
  if (error instanceof PumpStationError) {
    if (error.code === "INSUFFICIENT_BALANCE") return "Yetersiz bakiye";
    if (error.code === "GAS_SPONSOR_FAILED") return "GASSTATION gas sponsor hatası";
    if (error.code === "REJECTED") return "İşlem reddedildi";
    if (error.code === "NETWORK") return "Ağ hatası";
    return "İşlem tamamlanamadı";
  }
  return "Ağ hatası";
}

export type ExecuteTransferInput = {
  fromAddresses: string[];
  toAddress: string;
  amount: number;
  currency: TransferCurrency;
  recipient: ParsedRecipient;
};

export type ExecuteTransferResult = {
  route: OptimalRoute;
  transactionId: string;
};

export async function getTransferRoute(
  input: Omit<ExecuteTransferInput, "recipient"> & { toAddress: string },
) {
  return getPumpStationClient().getOptimalRoute(
    input.fromAddresses,
    input.toAddress,
    input.amount,
    input.currency,
  );
}

export async function executeTransfer(
  input: ExecuteTransferInput,
  existingRoute?: OptimalRoute,
): Promise<ExecuteTransferResult> {
  const client = getPumpStationClient();
  const toAddress = input.recipient.address || input.toAddress;

  const route =
    existingRoute ??
    (await client.getOptimalRoute(input.fromAddresses, toAddress, input.amount, input.currency));

  const result = await client.executeRoute(route, {
    evm: "stub-evm-signature",
    solana: "stub-solana-signature",
  });

  return { route, transactionId: result.transactionId };
}

export const pumpStationClient = {
  getAggregatedBalance,
  getAggregatedBalanceFromWallets,
  executeTransfer,
  getClient: getPumpStationClient,
};
