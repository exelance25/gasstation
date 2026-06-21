"use client";

import { useQuery } from "@tanstack/react-query";

export type OperatorTank = {
  asset: string;
  chainId: number;
  chainName: string;
  balanceNative: string;
  symbol: string;
};

type HealthTanks = {
  operators?: {
    address?: string | null;
    evm?: boolean;
    tanks?: OperatorTank[];
  };
};

export function useOperatorTanks() {
  return useQuery({
    queryKey: ["operator-tanks"],
    queryFn: async () => {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error("Health alınamadı");
      const body = (await res.json()) as HealthTanks;
      return {
        operatorAddress: body.operators?.address ?? null,
        tanks: body.operators?.tanks ?? [],
      };
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

/** Teslimat için yeterli native var mı — kabaca 0.001 minimum (testnet) */
export function isTankLikelyEmpty(tank: OperatorTank | undefined): boolean {
  if (!tank) return true;
  const bal = Number.parseFloat(tank.balanceNative);
  if (!Number.isFinite(bal)) return true;
  if (tank.asset === "MON") return bal < 0.05;
  return bal < 0.001;
}

export function findTankForAsset(
  tanks: OperatorTank[],
  asset: string,
): OperatorTank | undefined {
  return tanks.find((t) => t.asset === asset);
}
