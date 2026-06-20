"use client";

import { useCallback, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { maxUint256, type Address } from "viem";
import { erc20Abi } from "@/lib/erc20-abi";
import { isPaymasterDeployed } from "@/lib/paymaster";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";
import { getDefaultFeeToken, isFeeTokenConfigured } from "@/config/pool-tokens";
import { useToast } from "@/providers/ToastProvider";

/**
 * Otomatik mod: postOp için PumpPaymaster'a ERC-20 approve.
 */
export function useAutoGasApprove() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const approve = useCallback(
    async (token?: Address) => {
      if (!isConnected || !address) {
        showToast({ variant: "info", title: "Cüzdan gerekli", message: "MetaMask bağlayın." });
        return;
      }

      if (!isPaymasterDeployed() || !isFeeTokenConfigured()) {
        showToast({
          variant: "error",
          title: "Otomatik mod yapılandırılmamış",
          message: "Paymaster + USDC/USDT adresi gerekli.",
        });
        return;
      }

      const paymaster = getPumpPaymasterAddress();
      const feeToken = token ?? getDefaultFeeToken();
      if (!paymaster || feeToken === "0x0000000000000000000000000000000000000000") return;

      setIsPending(true);
      try {
        await writeContractAsync({
          address: feeToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [paymaster, maxUint256],
        });
        showToast({
          variant: "success",
          title: "Otomatik fee izni verildi",
          message: "İşlemler sonrası gas + %0.5 otomatik tahsil edilebilir.",
        });
      } catch (e) {
        showToast({
          variant: "error",
          title: "Approve başarısız",
          message: e instanceof Error ? e.message : "Reddedildi",
        });
      } finally {
        setIsPending(false);
      }
    },
    [address, isConnected, showToast, writeContractAsync],
  );

  return { approve, isPending };
}
