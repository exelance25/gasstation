"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DepotAssetId } from "@/config/depot-assets";
import { POOL_CAPACITY_USD } from "@/config/depot-assets";

type FuelTankContextValue = {
  /** Havuz doluluk — $100 depo (MON+ETH+BASE) */
  poolFillPercent: number;
  /** Seçilen paketin depodan alacağı pay */
  requestFillPercent: number;
  activeAsset: DepotAssetId;
  setPoolFillPercent: (value: number) => void;
  setRequestFillPercent: (value: number) => void;
  setActiveAsset: (asset: DepotAssetId) => void;
};

const FuelTankContext = createContext<FuelTankContextValue | null>(null);

/** Simüle: bağlı kasa ~$92 / $100 */
const DEFAULT_POOL_FILL = 92;

export function FuelTankProvider({ children }: { children: ReactNode }) {
  const [poolFillPercent, setPoolFillRaw] = useState(DEFAULT_POOL_FILL);
  const [requestFillPercent, setRequestFillRaw] = useState(0);
  const [activeAsset, setActiveAsset] = useState<DepotAssetId>("ETH");

  const setPoolFillPercent = useCallback((value: number) => {
    setPoolFillRaw(Math.min(100, Math.max(0, value)));
  }, []);

  const setRequestFillPercent = useCallback((value: number) => {
    setRequestFillRaw(Math.min(100, Math.max(0, value)));
  }, []);

  const value = useMemo(
    () => ({
      poolFillPercent,
      requestFillPercent,
      activeAsset,
      setPoolFillPercent,
      setRequestFillPercent,
      setActiveAsset,
    }),
    [
      poolFillPercent,
      requestFillPercent,
      activeAsset,
      setPoolFillPercent,
      setRequestFillPercent,
    ],
  );

  return (
    <FuelTankContext.Provider value={value}>{children}</FuelTankContext.Provider>
  );
}

export function useFuelTank() {
  const ctx = useContext(FuelTankContext);
  if (!ctx) {
    throw new Error("useFuelTank must be used within FuelTankProvider");
  }
  return ctx;
}

/** Paket USD → depo içindeki talep yüzdesi */
export function packageToRequestPercent(packageUsd: number): number {
  return Math.min(100, (packageUsd / POOL_CAPACITY_USD) * 100);
}
