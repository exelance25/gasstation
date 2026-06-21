"use client";

import { useQuery } from "@tanstack/react-query";
import { isAddress, type Address } from "viem";
import { parseResponseJson } from "@/lib/api/parse-response-json";
import { getCollectorAddress } from "@/lib/treasury-config";

async function readAddress(raw: string | null | undefined): Promise<Address | null> {
  const trimmed = raw?.trim();
  if (!trimmed || !isAddress(trimmed)) return null;
  return trimmed as Address;
}

async function fetchServerCollectorAddress(): Promise<Address | null> {
  const healthRes = await fetch("/api/health", { cache: "no-store" });
  const health = await parseResponseJson<{
    collector?: { server?: string | null };
  }>(healthRes);
  if (healthRes.ok && health?.collector?.server) {
    const fromHealth = await readAddress(health.collector.server);
    if (fromHealth) return fromHealth;
  }

  const collectorRes = await fetch("/api/treasury/collector", { cache: "no-store" });
  const collector = await parseResponseJson<{ address?: string | null }>(collectorRes);
  if (!collectorRes.ok || !collector) return null;
  return readAddress(collector.address);
}

/**
 * Kasa adresi — önce NEXT_PUBLIC_COLLECTOR_ADDRESS, yoksa sunucu COLLECTOR_ADDRESS.
 */
export function useCollectorAddress() {
  const fromEnv = getCollectorAddress();

  const serverQuery = useQuery({
    queryKey: ["treasury-collector"],
    queryFn: fetchServerCollectorAddress,
    enabled: !fromEnv,
    staleTime: 60_000,
    retry: 1,
  });

  const address = fromEnv ?? serverQuery.data ?? null;

  return {
    address,
    isConfigured: Boolean(address),
    isLoading: !fromEnv && serverQuery.isLoading,
  };
}
