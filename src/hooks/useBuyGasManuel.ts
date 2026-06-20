"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { isAddress, parseUnits, type Address } from "viem";
import type { PaymentAssetId } from "@/config/pool-tokens";
import { getPaymentAsset } from "@/config/pool-tokens";
import { erc20Abi } from "@/lib/erc20-abi";
import { pumpPaymasterAbi } from "@/lib/contracts/pump-paymaster-abi";
import { isPaymasterDeployed } from "@/lib/paymaster";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";
import {
  calculateManuelGasOut,
  type ManuelGasTarget,
} from "@/lib/oracle/calculate-manuel-gas-out";
import { useToast } from "@/providers/ToastProvider";

export function useBuyGasManuel() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const buyGas = useCallback(
    async (
      tokenId: PaymentAssetId | "BASE-USDC",
      amountPaid: string,
      targetToken: ManuelGasTarget = "ETH",
      recipient?: string,
    ) => {
      if (!isConnected || !address) {
        showToast({ variant: "info", title: "Cüzdan gerekli", message: "Cüzdan bağlayın." });
        return;
      }

      const normalizedId = tokenId === "BASE-USDC" ? "USDC" : tokenId;
      const token = getPaymentAsset(normalizedId);
      if (!isPaymasterDeployed() || !token?.enabled || !token.contractAddress) {
        showToast({
          variant: "error",
          title: "Manuel gas kapalı",
          message: token?.hint ?? "Paymaster veya token adresi yok.",
        });
        return;
      }

      const gasRecipient =
        recipient && isAddress(recipient) ? (recipient as Address) : address;

      const paymaster = getPumpPaymasterAddress();
      if (!paymaster) return;

      setIsPending(true);
      try {
        const usdcIn = Number(amountPaid);
        const quote = await calculateManuelGasOut(usdcIn, targetToken);
        if (quote.contractGasWei <= 0n) {
          throw new Error("Geçersiz tutar veya fiyat");
        }

        const amountPaidWei = parseUnits(amountPaid, token.decimals);

        const allowance = await publicClient!.readContract({
          address: token.contractAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, paymaster],
        });

        if (allowance < amountPaidWei) {
          await writeContractAsync({
            address: token.contractAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [paymaster, amountPaidWei],
          });
        }

        await writeContractAsync({
          address: paymaster,
          abi: pumpPaymasterAbi,
          functionName: "buyGasManuel",
          args: [
            token.contractAddress,
            amountPaidWei,
            quote.contractGasWei,
            gasRecipient,
          ],
        });

        showToast({
          variant: "success",
          title: "Manuel gas alındı",
          message: `${amountPaid} ${token.symbol} → ${gasRecipient.slice(0, 10)}…`,
        });
      } catch (e) {
        showToast({
          variant: "error",
          title: "buyGasManuel başarısız",
          message: e instanceof Error ? e.message : "İşlem reddedildi",
        });
      } finally {
        setIsPending(false);
      }
    },
    [address, isConnected, publicClient, showToast, writeContractAsync],
  );

  return { buyGas, isPending };
}
