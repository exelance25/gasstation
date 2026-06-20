import { getPumpStationClient } from "@/lib/pumpstation-client";
import {
  resolveGasForTransaction,
  settleGasAfterTransaction,
  type GasSponsorContext,
} from "@/lib/gas-sponsor";
import type {
  PumpStationGasSponsorshipRecord,
  PumpStationProofRequest,
  PumpStationSettlementStatus,
  PumpStationSpendingIntent,
} from "@/pumpstation/pumpstation-types";

/** PUMPSTATION uygulama katmanı — gas engine orchestration */
export const pumpStationService = {
  async getAggregatedBalance(addresses: string[]) {
    return getPumpStationClient().getAggregatedBalance(addresses);
  },

  createSpendingIntent(intent: PumpStationSpendingIntent) {
    return { type: "create_intent" as const, payload: intent };
  },

  async submitSpendingIntent(input: {
    intentId: string;
    amount: number;
    proofRequired: boolean;
  }) {
    const intent: PumpStationSpendingIntent = {
      id: input.intentId,
      amount: String(input.amount),
      asset: "USD",
      destination: "pumpstation-settlement",
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

  requestProof(proofRequest: PumpStationProofRequest) {
    return { type: "request_proof" as const, payload: proofRequest };
  },

  trackSettlement(intentId: string): { intentId: string; status: PumpStationSettlementStatus } {
    return { intentId, status: "pending" };
  },

  async prepareGasSponsorship(ctx: GasSponsorContext) {
    return resolveGasForTransaction(ctx);
  },

  async finalizeGasSponsorship(
    sponsorshipId: string,
  ): Promise<PumpStationGasSponsorshipRecord> {
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
