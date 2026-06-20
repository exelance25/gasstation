export type GasDeliveryAsset = "ETH" | "MON" | "BASE" | "SOL";

export type LivePrices = {
  ETH_Price: number;
  BASE_Price: number;
  MON_Price: number;
  SOL_Price: number;
  USDC_Price?: number;
};
