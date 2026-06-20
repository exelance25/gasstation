"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isAutoFeeEnabled } from "@/config/client-env";
import { DEFAULT_GAS_MODE, type GasMode } from "@/types/gas-mode";

const STORAGE_KEY = "gasstation-gas-mode";

type GasModeContextValue = {
  mode: GasMode;
  setMode: (mode: GasMode) => void;
  isAutomatic: boolean;
  isManual: boolean;
};

const GasModeContext = createContext<GasModeContextValue | null>(null);

function readStoredMode(): GasMode {
  if (typeof window === "undefined") return DEFAULT_GAS_MODE;
  if (!isAutoFeeEnabled()) return "manual";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "manual" || stored === "automatic" ? stored : DEFAULT_GAS_MODE;
}

export function GasModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<GasMode>(DEFAULT_GAS_MODE);

  useEffect(() => {
    setModeState(readStoredMode());
  }, []);

  const setMode = useCallback((next: GasMode) => {
    const resolved = next === "automatic" && !isAutoFeeEnabled() ? "manual" : next;
    setModeState(resolved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolved);
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isAutomatic: mode === "automatic",
      isManual: mode === "manual",
    }),
    [mode, setMode],
  );

  return <GasModeContext.Provider value={value}>{children}</GasModeContext.Provider>;
}

export function useGasModeContext() {
  const ctx = useContext(GasModeContext);
  if (!ctx) throw new Error("useGasModeContext must be used within GasModeProvider");
  return ctx;
}
