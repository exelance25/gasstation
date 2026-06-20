/** Kullanıcıya gösterilen kasa kimliği — ham cüzdan adresi asla UI'da gösterilmez. */
export const GASSTATION_VAULT_ID = "GASSTATION";

/** @deprecated GASSTATION_VAULT_ID kullanın */
export const GASSTATION_VAULT_ID_ALIAS = GASSTATION_VAULT_ID;

export function getVaultDisplayLabel(network?: string): string {
  if (!network) return GASSTATION_VAULT_ID;
  return `${GASSTATION_VAULT_ID} · ${network}`;
}

/** Explorer / UI için adres yerine marka etiketi */
export function maskVaultAddress(_address?: string | null, network?: string): string {
  return getVaultDisplayLabel(network);
}
