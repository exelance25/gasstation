"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import type { Hex } from "viem";
import {
  attachSignature,
  fetchRelayerStatus,
  prepareUserOp,
  submitUserOp,
} from "@/lib/relay-client";
import { isPaymasterDeployed } from "@/lib/paymaster-config";
import type { GasMode } from "@/types/gas-mode";

export type PumpRelayParams = {
  sender: `0x${string}`;
  gasMode: GasMode;
  intentId: string;
  usePaymaster?: boolean;
};

/**
 * ERC-4337: prepare → cüzdan imzası → relayer handleOps
 */
export function usePumpRelay() {
  const { data: walletClient } = useWalletClient();
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchRelayerStatus()
      .then((s) => {
        if (!cancelled) setEnabled(s.enabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signAndRelay = useCallback(
    async ({ sender, gasMode, intentId, usePaymaster }: PumpRelayParams) => {
      if (!walletClient) {
        throw new Error("Cüzdan bağlı değil");
      }

      const shouldUsePaymaster =
        usePaymaster ?? (gasMode === "automatic" && isPaymasterDeployed());

      const { userOp, userOpHash } = await prepareUserOp({
        sender,
        usePaymaster: shouldUsePaymaster,
      });

      const hashBytes = userOpHash as Hex;

      const signature = await walletClient.signMessage({
        account: sender,
        message: { raw: hashBytes },
      });

      const signed = attachSignature(userOp, signature);
      const result = await submitUserOp({ userOp: signed, intentId });

      return result.transactionHash;
    },
    [walletClient],
  );

  return {
    isRelayerEnabled: enabled,
    isCheckingRelayer: checking,
    signAndRelay,
  };
}
