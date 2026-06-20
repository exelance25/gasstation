export type GasStationSpendingIntent = {
  id: string;
  amount: string;
  asset: "USD";
  destination: string;
  createdAt: string;
};

export type GasStationProofRequest = {
  intentId: string;
  challenge: string;
  userAddress: string;
};

export type GasStationSettlementStatus = "pending" | "processing" | "settled" | "failed";

export type GasStationGasSponsorshipRecord = {
  sponsorshipId: string;
  intentId: string;
  userAddress: string;
  chainId: number;
  status: GasStationSettlementStatus;
  reclaimedFeeUsd: number;
};
