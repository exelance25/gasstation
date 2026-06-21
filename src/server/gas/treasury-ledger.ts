import "server-only";

import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import { computePackageAccounting } from "@/lib/treasury-accounting";

export type TreasuryLedgerEntry = {
  at: string;
  depositTxHash: string;
  deliveryTxHash: string;
  depositChainId: number;
  packageUsd: AmountOption;
  targetAsset: GasDeliveryAsset;
  targetAddress: string;
  estimatedGasAmount: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd: number;
};

function ledgerPath(): string {
  const configured = process.env.TREASURY_LEDGER_FILE?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), ".data", "treasury-ledger.jsonl");
}

export function recordTreasuryDispense(params: {
  depositTxHash: string;
  deliveryTxHash: string;
  depositChainId: number;
  packageUsd: AmountOption;
  targetAsset: GasDeliveryAsset;
  targetAddress: string;
  estimatedGasAmount: number;
}): TreasuryLedgerEntry {
  const accounting = computePackageAccounting(params.packageUsd);
  const entry: TreasuryLedgerEntry = {
    at: new Date().toISOString(),
    depositTxHash: params.depositTxHash,
    deliveryTxHash: params.deliveryTxHash,
    depositChainId: params.depositChainId,
    packageUsd: params.packageUsd,
    targetAsset: params.targetAsset,
    targetAddress: params.targetAddress,
    estimatedGasAmount: params.estimatedGasAmount,
    protocolFeeUsd: accounting.protocolFeeUsd,
    networkFeeUsd: accounting.networkFeeUsd,
    netUsdForGas: accounting.netUsdForGas,
    treasuryRetainedUsd: accounting.treasuryRetainedUsd,
  };

  const path = ledgerPath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    /* Vercel — ledger opsiyonel, gas teslimi devam eder */
  }
  return entry;
}

export function readTreasuryLedger(limit = 50): TreasuryLedgerEntry[] {
  const path = ledgerPath();
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line) as TreasuryLedgerEntry)
    .reverse();
}

export function summarizeTreasuryLedger(entries: TreasuryLedgerEntry[]): {
  totalDepositsUsd: number;
  totalRetainedUsd: number;
  totalGasBudgetUsd: number;
  count: number;
} {
  let totalDepositsUsd = 0;
  let totalRetainedUsd = 0;
  let totalGasBudgetUsd = 0;
  for (const e of entries) {
    totalDepositsUsd += e.packageUsd;
    totalRetainedUsd += e.treasuryRetainedUsd;
    totalGasBudgetUsd += e.netUsdForGas;
  }
  return {
    totalDepositsUsd,
    totalRetainedUsd,
    totalGasBudgetUsd,
    count: entries.length,
  };
}
