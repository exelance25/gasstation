"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { usePaymasterContract } from "@/hooks/usePaymasterContract";
import { useAdminSession } from "@/hooks/useAdminSession";

/**
 * Admin: sunucu oturumu (Gas Havuzu) VEYA PumpPaymaster on-chain owner.
 */
export function useIsAdminWallet() {
  const { address, isConnected } = useAccount();
  const { isOwner } = usePaymasterContract(address);
  const { authenticated } = useAdminSession();

  const isAdmin = useMemo(() => {
    if (!isConnected || !address) return false;
    if (authenticated) return true;
    return isOwner;
  }, [address, authenticated, isConnected, isOwner]);

  return {
    isAdmin,
    isConnected,
    address,
    isSessionAdmin: authenticated,
    isContractOwner: isOwner,
  };
}
