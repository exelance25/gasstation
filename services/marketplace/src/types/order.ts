import type { Address } from "viem";

export type PaymentChain = "ethereum" | "base" | "monad";
export type DeliveryChain = "ethereum" | "base" | "monad" | "solana";
export type DeliveryAsset = "ETH" | "BASE" | "MON" | "SOL";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "FULFILLING"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "REFUND_PENDING";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "FULFILLING",
  "COMPLETED",
  "EXPIRED",
  "FAILED",
  "REFUND_PENDING",
];

export const PAYMENT_CHAINS: PaymentChain[] = ["ethereum", "base", "monad"];
export const DELIVERY_CHAINS: DeliveryChain[] = ["ethereum", "base", "monad", "solana"];

export const CHAIN_IDS: Record<PaymentChain, number> = {
  ethereum: 1,
  base: 8453,
  monad: 143,
};

export const TESTNET_CHAIN_IDS: Record<PaymentChain, number> = {
  ethereum: 11155111,
  base: 84532,
  monad: 10143,
};

export const USDC_BY_CHAIN: Record<number, Address> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  143: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  10143: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
};

export const USDC_DECIMALS = 6;
export const PACKAGE_AMOUNTS = [0.05, 0.1, 0.2] as const;
export type PackageAmount = (typeof PACKAGE_AMOUNTS)[number];

export const DELIVERY_ASSET_BY_CHAIN: Record<DeliveryChain, DeliveryAsset> = {
  ethereum: "ETH",
  base: "BASE",
  monad: "MON",
  solana: "SOL",
};

export const erc20TransferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;

export type OrderRow = {
  id: number;
  order_id: string;
  payment_chain: PaymentChain;
  payment_token: string;
  payment_amount: string;
  destination_chain: DeliveryChain;
  destination_address: string;
  delivery_amount: string;
  delivery_asset: DeliveryAsset;
  status: OrderStatus;
  deposit_address: string;
  derivation_index: number;
  payment_tx_hash: string | null;
  delivery_tx_hash: string | null;
  expires_at: Date;
  payment_confirmed_at: Date | null;
  completed_at: Date | null;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CreateOrderInput = {
  paymentChain: PaymentChain;
  paymentToken?: string;
  paymentAmount: PackageAmount;
  destinationChain: DeliveryChain;
  destinationAddress: string;
  deliveryAmount?: number;
};

export type OrderResponse = {
  orderId: string;
  paymentChain: PaymentChain;
  paymentToken: string;
  paymentAmount: number;
  destinationChain: DeliveryChain;
  destinationAddress: string;
  deliveryAmount: number;
  deliveryAsset: DeliveryAsset;
  status: OrderStatus;
  depositAddress: string;
  expiresAt: string;
  paymentTxHash: string | null;
  deliveryTxHash: string | null;
  createdAt: string;
};
