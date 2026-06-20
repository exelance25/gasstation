import { randomUUID } from "node:crypto";
import { isAddress } from "viem";
import type {
  CreateOrderInput,
  OrderResponse,
  PackageAmount,
  PaymentChain,
  DeliveryChain,
} from "../types/order.js";
import {
  DELIVERY_CHAINS,
  PACKAGE_AMOUNTS,
  PAYMENT_CHAINS,
} from "../types/order.js";
import { createOrderRecord } from "../db/orders-repo.js";
import { fetchOracleQuote, resolveDeliveryAsset } from "./pricing-service.js";
import { getEnv } from "../config/env.js";

const SOLANA_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function validateDestinationAddress(
  chain: DeliveryChain,
  address: string,
): boolean {
  const trimmed = address.trim();
  if (chain === "solana") return SOLANA_REGEX.test(trimmed);
  return isAddress(trimmed);
}

export function validateCreateOrderInput(input: CreateOrderInput): string | null {
  if (!PAYMENT_CHAINS.includes(input.paymentChain)) {
    return "Desteklenmeyen ödeme ağı";
  }
  if (!DELIVERY_CHAINS.includes(input.destinationChain)) {
    return "Desteklenmeyen teslimat ağı";
  }
  if (!PACKAGE_AMOUNTS.includes(input.paymentAmount as PackageAmount)) {
    return "Geçersiz paket tutarı — 0.05, 0.10 veya 0.20 USDC";
  }
  if (!validateDestinationAddress(input.destinationChain, input.destinationAddress)) {
    return "Geçersiz hedef adres";
  }
  return null;
}

export function toOrderResponse(row: Awaited<ReturnType<typeof createOrderRecord>>): OrderResponse {
  return {
    orderId: row.order_id,
    paymentChain: row.payment_chain as PaymentChain,
    paymentToken: row.payment_token,
    paymentAmount: Number(row.payment_amount),
    destinationChain: row.destination_chain as DeliveryChain,
    destinationAddress: row.destination_address,
    deliveryAmount: Number(row.delivery_amount),
    deliveryAsset: row.delivery_asset as OrderResponse["deliveryAsset"],
    status: row.status,
    depositAddress: row.deposit_address,
    expiresAt: row.expires_at.toISOString(),
    paymentTxHash: row.payment_tx_hash,
    deliveryTxHash: row.delivery_tx_hash,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createMarketplaceOrder(
  input: CreateOrderInput,
): Promise<OrderResponse> {
  const validationError = validateCreateOrderInput(input);
  if (validationError) throw new Error(validationError);

  const deliveryAsset = resolveDeliveryAsset(input.destinationChain);
  const quote = await fetchOracleQuote(
    input.paymentAmount,
    deliveryAsset,
    input.destinationChain,
  );

  const env = getEnv();
  const expiresAt = new Date(
    Date.now() + env.ORDER_EXPIRY_MINUTES * 60 * 1000,
  );

  const orderId = randomUUID();
  const row = await createOrderRecord(
    orderId,
    input,
    quote.deliveryAmount,
    deliveryAsset,
    expiresAt,
  );

  return toOrderResponse(row);
}
