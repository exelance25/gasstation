/** Gas ödeme modu — manuel: kullanıcı Base ETH; otomatik: PUMPSTATION sponsor */
export type GasMode = "manual" | "automatic";

export const GAS_MODE_LABELS: Record<GasMode, { tr: string; en: string }> = {
  manual: { tr: "Manuel", en: "Manual" },
  automatic: { tr: "Otomatik", en: "Automatic" },
};

export const DEFAULT_GAS_MODE: GasMode = "manual";
