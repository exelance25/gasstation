/**
 * GASSTATION + PumpPaymaster — otomatik modda ERC-20 approve + postOp tahsil.
 */

import { getPumpStationClient, PumpStationError } from "@/lib/pumpstation-client";
import { SUPPORTED_SOURCE_CHAIN_ID } from "@/lib/chains";
import { MIN_BASE_GAS_WEI } from "@/lib/gas-requirements";
import {
  isPaymasterDeployed,
  readFeeTokenAllowance,
  readPoolNativeBalance,
} from "@/lib/paymaster";
import { getDefaultFeeToken, isFeeTokenConfigured } from "@/config/pool-tokens";
import { applyPaymasterFee } from "@/lib/contracts/pump-paymaster-abi";
import type { GasMode } from "@/types/gas-mode";
import type {
  GasEligibilityResult,
  GasSettlementResult,
  GasSponsorshipResult,
} from "@pumpstation/gas-engine";
import type { Address } from "viem";

export type { GasEligibilityResult, GasSponsorshipResult, GasSettlementResult };

export type GasSponsorContext = {
  userAddress: `0x${string}`;
  nativeBalanceWei: bigint;
  intentId: string;
  mode: GasMode;
  estimatedGasUsd?: number;
};

export type GasSponsorFlowResult = {
  sponsored: boolean;
  sponsorship?: GasSponsorshipResult;
  eligibility: GasEligibilityResult;
  protocolPoolWei: bigint;
  hasFeeAllowance: boolean;
};

const MIN_FEE_ALLOWANCE_WEI = 1_000_000n; // 0.001 USDC (6 dec) stub floor

export async function resolveGasForTransaction(
  ctx: GasSponsorContext,
): Promise<GasSponsorFlowResult> {
  const client = getPumpStationClient();
  const protocolPoolWei = isPaymasterDeployed() ? await readPoolNativeBalance() : 0n;

  let allowance = 0n;
  if (isPaymasterDeployed() && isFeeTokenConfigured()) {
    allowance = await readFeeTokenAllowance(ctx.userAddress, getDefaultFeeToken());
  }

  const hasFeeAllowance = allowance >= MIN_FEE_ALLOWANCE_WEI;
  const estimatedGasWei = 21_000n * 50_000_000n;
  const maxCharge = applyPaymasterFee(estimatedGasWei);

  const eligibility = await client.checkGasEligibility(
    ctx.userAddress,
    SUPPORTED_SOURCE_CHAIN_ID,
    ctx.nativeBalanceWei,
  );

  const needsSponsor =
    ctx.mode === "automatic" &&
    eligibility.needsSponsorship &&
    ctx.nativeBalanceWei < MIN_BASE_GAS_WEI &&
    hasFeeAllowance &&
    protocolPoolWei >= estimatedGasWei;

  if (!needsSponsor) {
    return {
      sponsored: false,
      eligibility,
      protocolPoolWei,
      hasFeeAllowance,
    };
  }

  const sponsorship = await client.requestGasSponsorship({
    userAddress: ctx.userAddress,
    chainId: SUPPORTED_SOURCE_CHAIN_ID,
    intentId: ctx.intentId,
    estimatedGasUsd: ctx.estimatedGasUsd ?? 0.5,
  });

  return {
    sponsored: true,
    sponsorship: {
      ...sponsorship,
      message: `${sponsorship.message} · postOp max ~${maxCharge} wei fee token`,
    },
    eligibility,
    protocolPoolWei,
    hasFeeAllowance,
  };
}

export async function settleGasAfterTransaction(
  sponsorshipId: string,
): Promise<GasSettlementResult> {
  return getPumpStationClient().settleGasSponsorship(sponsorshipId);
}

export function mapGasSponsorError(error: unknown): string {
  if (error instanceof PumpStationError) {
    if (error.code === "GAS_SPONSOR_FAILED") {
      return "GASSTATION gas sponsor başarısız.";
    }
    if (error.code === "INSUFFICIENT_BALANCE") {
      return "Yetersiz bakiye veya fee izni (approve) gerekli.";
    }
    if (error.code === "NETWORK") return "Ağ hatası";
    return "Gas sponsor tamamlanamadı";
  }
  return "Beklenmeyen gas sponsor hatası";
}
