"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAddress, type Address } from "viem";
import { readProviderAccounts } from "@/lib/injected-provider";

/**
 * Wagmi adresi ile cüzdan provider eth_accounts senkronu.
 * Phantom'da onaylanan hesap ≠ wagmi cache durumunu önler.
 */
export function useEvmProviderAccount() {
  const { address: wagmiAddress, isConnected, connector, chainId } = useAccount();
  const [providerAddress, setProviderAddress] = useState<Address | undefined>();

  const syncFromProvider = useCallback(async () => {
    if (!connector) {
      setProviderAddress(undefined);
      return;
    }

    const provider = await connector.getProvider?.();
    const accounts = await readProviderAccounts(provider);
    setProviderAddress(accounts[0]);
  }, [connector]);

  useEffect(() => {
    if (!isConnected) {
      setProviderAddress(undefined);
    }
  }, [isConnected]);

  useEffect(() => {
    void syncFromProvider();
  }, [syncFromProvider, wagmiAddress]);

  useEffect(() => {
    if (!isConnected || !connector) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const provider = (await connector.getProvider?.()) as {
        on?: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      } | null;
      if (!provider?.on || cancelled) return;

      const handler = (accounts: unknown) => {
        const list = Array.isArray(accounts) ? accounts : [];
        if (typeof list[0] === "string") {
          setProviderAddress(getAddress(list[0]));
        } else {
          setProviderAddress(undefined);
        }
      };

      provider.on("accountsChanged", handler);
      removeListener = () => provider.removeListener?.("accountsChanged", handler);
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [connector, isConnected]);

  // Bağlı değilken eski adresin UI'da görünmesini engelle.
  const address = isConnected ? (providerAddress ?? wagmiAddress) : undefined;

  return {
    address,
    wagmiAddress,
    providerAddress,
    isConnected,
    chainId,
    connector,
    syncFromProvider,
  };
}
