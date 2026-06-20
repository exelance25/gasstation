import { getCollectorAddress } from "@/lib/treasury-config";
import type { TreasuryVaultNetworks } from "@/lib/treasury-accounting";
import { getVaultDisplayLabel } from "@/lib/vault-display";

/**
 * 4 ağlı gas tankı — Phantom/Solana + EVM kasa (ETH, Base, Monad).
 * USDC depozit → GASSTATION kasası; gas teslimat → operatör cüzdanları (.env private key).
 * Ham cüzdan adresleri kullanıcıya gösterilmez.
 */
export function getTreasuryVault(): TreasuryVaultNetworks | null {
  const evmCollector = getCollectorAddress();

  const solanaConfigured = Boolean(
    process.env.SOLANA_COLLECTOR_ADDRESS?.trim() ||
      process.env.NEXT_PUBLIC_SOLANA_VAULT_ADDRESS?.trim(),
  );

  if (!evmCollector && !solanaConfigured) return null;

  const evmLabel = getVaultDisplayLabel("EVM");
  const solLabel = getVaultDisplayLabel("Solana");

  return {
    ethereum: { vaultLabel: evmLabel },
    base: { vaultLabel: evmLabel },
    monad: { vaultLabel: evmLabel },
    solana: { vaultLabel: solLabel },
  };
}

export function isTreasuryVaultConfigured(): boolean {
  return getTreasuryVault() !== null;
}
