"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/use-app-store";

const EXPECTED_EVM_CHAIN: Record<string, number> = {
  development: 11155111,
  staging: 11155111,
  testnet: 11155111,
  mainnet: 1
};

export function useChainGuard() {
  const { t } = useTranslation();
  const env = useAppStore((s) => s.env);
  const { chainId, isConnected } = useAccount();
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const next: string[] = [];
    if (isConnected && chainId && chainId !== EXPECTED_EVM_CHAIN[env]) {
      next.push(t("chainMismatch"));
    }
    setWarnings(next);
  }, [chainId, env, isConnected, t]);

  return { warnings };
}
