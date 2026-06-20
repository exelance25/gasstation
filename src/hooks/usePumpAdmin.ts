"use client";

import { useCallback, useState } from "react";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { parseEther, parseUnits, type Address } from "viem";
import {
  encodeAdminNativeLiquidity,
  encodeAdminTokenLiquidity,
} from "@/lib/paymaster";
import { usePaymasterContract } from "@/hooks/usePaymasterContract";
import { useToast } from "@/providers/ToastProvider";
import { erc20Abi } from "@/lib/erc20-abi";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";

export function usePumpAdmin() {
  const { address } = useAccount();
  const { isOwner, refetch } = usePaymasterContract(address);
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const addNative = useCallback(
    async (amountEth: string) => {
      if (!isOwner) return;
      setIsPending(true);
      try {
        const value = parseEther(amountEth);
        const tx = encodeAdminNativeLiquidity(value);
        if (!tx) throw new Error("Invalid amount");
        await sendTransactionAsync({ to: tx.to, data: tx.data, value: tx.value });
        showToast({ variant: "success", title: "Admin", message: "Native likidite eklendi." });
        refetch();
      } catch (e) {
        showToast({
          variant: "error",
          title: "Admin native",
          message: e instanceof Error ? e.message : "Hata",
        });
      } finally {
        setIsPending(false);
      }
    },
    [isOwner, refetch, sendTransactionAsync, showToast],
  );

  const addToken = useCallback(
    async (token: Address, amount: string, decimals: number) => {
      if (!isOwner || !address) return;
      const paymaster = getPumpPaymasterAddress();
      if (!paymaster) return;

      setIsPending(true);
      try {
        const amountWei = parseUnits(amount, decimals);
        await writeContractAsync({
          address: token,
          abi: erc20Abi,
          functionName: "approve",
          args: [paymaster, amountWei],
        });
        const tx = encodeAdminTokenLiquidity(token, amountWei);
        if (!tx) throw new Error("Invalid tx");
        await sendTransactionAsync({ to: tx.to, data: tx.data, value: tx.value });
        showToast({ variant: "success", title: "Admin", message: "Token likidite eklendi." });
        refetch();
      } catch (e) {
        showToast({
          variant: "error",
          title: "Admin token",
          message: e instanceof Error ? e.message : "Hata",
        });
      } finally {
        setIsPending(false);
      }
    },
    [address, isOwner, refetch, sendTransactionAsync, showToast, writeContractAsync],
  );

  return { isOwner, addNative, addToken, isPending };
}
