export type PumpStationSpendingIntent = {
  id: string;
  amount: string;
  asset: "USD";
  destination: string;
  createdAt: string;
};

export type PumpStationProofRequest = {
  intentId: string;
  challenge: string;
  userAddress: string;
};

export type PumpStationSettlementStatus = "pending" | "processing" | "settled" | "failed";

export type PumpStationGasSponsorshipRecord = {
  sponsorshipId: string;
  intentId: string;
  userAddress: string;
  chainId: number;
  status: PumpStationSettlementStatus;
  reclaimedFeeUsd: number;
};
