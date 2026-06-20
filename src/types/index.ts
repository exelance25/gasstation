export type AppEnv = "development" | "staging" | "testnet" | "mainnet";
export type AppLocale = "en" | "tr";

export type UnifiedBalance = {
  crypto: number;
  fiat: number;
  currency: "USD" | "EUR" | "TRY";
  lastUpdated: string;
};

export type WalletRiskLevel = "low" | "medium" | "high";
