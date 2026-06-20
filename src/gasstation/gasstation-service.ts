import { getGasStationClient } from "@/lib/gasstation-client";
import {
  resolveGasForTransaction,
  settleGasAfterTransaction,
  type GasSponsorContext,
} from "@/lib/gas-sponsor";
import type {
  GasStationGasSponsorshipRecord,
  GasStationProofRequest,
  GasStationSettlementStatus,
  GasStationSpendingIntent,
} from "@/gasstation/gasstation-types";

/** GASSTATION uygulama katmanı — gas engine orchestration */
export const gasStationService = {
  async getAggregatedBalance(addresses: string[]) {
    return getGasStationClient().getAggregatedBalance(addresses);
  },

  createSpendingIntent(intent: GasStationSpendingIntent) {
    return { type: "create_intent" as const, payload: intent };
  },

  async submitSpendingIntent(input: {
    intentId: string;
    amount: number;
    proofRequired: boolean;
  }) {
    const intent: GasStationSpendingIntent = {
      id: input.intentId,
      amount: String(input.amount),
      asset: "USD",
      destination: "gasstation-settlement",
      createdAt: new Date().toISOString(),
    };
    if (input.proofRequired) {
      this.requestProof({
        intentId: input.intentId,
        challenge: `proof-${input.intentId}`,
        userAddress: "pending-wallet-address",
      });
    }
    return this.createSpendingIntent(intent);
  },

  requestProof(proofRequest: GasStationProofRequest) {
    return { type: "request_proof" as const, payload: proofRequest };
  },

  trackSettlement(intentId: string): { intentId: string; status: GasStationSettlementStatus } {
    return { intentId, status: "pending" };
  },

  async prepareGasSponsorship(ctx: GasSponsorContext) {
    return resolveGasForTransaction(ctx);
  },

  async finalizeGasSponsorship(
    sponsorshipId: string,
  ): Promise<GasStationGasSponsorshipRecord> {
    const settlement = await settleGasAfterTransaction(sponsorshipId);
    return {
      sponsorshipId,
      intentId: sponsorshipId.split("_")[1] ?? sponsorshipId,
      userAddress: "",
      chainId: 0,
      status: settlement.status === "settled" ? "settled" : "failed",
      reclaimedFeeUsd: settlement.reclaimedFeeUsd,
    };
  },
};
