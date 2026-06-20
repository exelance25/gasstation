import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import type { PaySymbol } from "@/config/payment-assets";
import { generateTicketId } from "@/server/gas/ticket-id";
import { validatePumpPass } from "@/server/gas/pump-pass";

export type GasOrderStatus =
  | "awaiting_payment"
  | "delivered"
  | "failed"
  | "expired";

export type GasOrder = {
  orderId: string;
  passId: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
  paySymbol: PaySymbol;
  paymentMode: "usdc" | "native";
  status: GasOrderStatus;
  createdAt: number;
  expiresAt: number;
  depositTxHash?: string;
  deliveryTxHash?: string;
  deliveredAt?: number;
  failReason?: string;
};

type OrderStore = { orders: GasOrder[] };

const ORDER_TTL_MS = 30 * 60 * 1000;
const MAX_ORDERS = 2_000;

function storePath(): string {
  const configured = process.env.GAS_ORDER_FILE?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), ".data", "gas-orders.json");
}

function loadStore(): OrderStore {
  const path = storePath();
  if (!existsSync(path)) return { orders: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as OrderStore;
    return Array.isArray(parsed.orders) ? parsed : { orders: [] };
  } catch {
    return { orders: [] };
  }
}

function saveStore(store: OrderStore): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
}

function prune(store: OrderStore): OrderStore {
  const now = Date.now();
  const orders = store.orders
    .map((o) => {
      if (o.status === "awaiting_payment" && now > o.expiresAt) {
        return { ...o, status: "expired" as const };
      }
      return o;
    })
    .slice(-MAX_ORDERS);
  return { orders };
}

export function createGasOrder(input: {
  passId: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
  paySymbol: PaySymbol;
  paymentMode: "usdc" | "native";
}): GasOrder {
  const pass = validatePumpPass(input.passId, input.depositorAddress);
  if (!pass) {
    throw new Error("Geçersiz veya süresi dolmuş giriş bileti (PumpPass)");
  }

  const store = prune(loadStore());
  const now = Date.now();
  const order: GasOrder = {
    orderId: generateTicketId("GO"),
    passId: input.passId,
    targetAsset: input.targetAsset,
    targetAddress: input.targetAddress.trim(),
    packageAmount: input.packageAmount,
    depositChainId: input.depositChainId,
    depositorAddress: input.depositorAddress.trim().toLowerCase(),
    paySymbol: input.paySymbol,
    paymentMode: input.paymentMode,
    status: "awaiting_payment",
    createdAt: now,
    expiresAt: now + ORDER_TTL_MS,
  };
  store.orders.push(order);
  saveStore(store);
  return order;
}

export function getGasOrder(orderId: string): GasOrder | null {
  return prune(loadStore()).orders.find((o) => o.orderId === orderId) ?? null;
}

export function findOpenOrderForDepositor(
  depositorAddress: string,
  depositChainId: number,
): GasOrder | null {
  const dep = depositorAddress.trim().toLowerCase();
  const now = Date.now();
  return (
    prune(loadStore())
      .orders.filter(
        (o) =>
          o.status === "awaiting_payment" &&
          o.depositorAddress === dep &&
          o.depositChainId === depositChainId &&
          o.expiresAt > now,
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
  );
}

export function assertOrderMatchesDispense(
  orderId: string | undefined,
  input: {
    targetAsset: DepotAssetId;
    targetAddress: string;
    packageAmount: AmountOption;
    depositorAddress?: string;
    depositChainId: number;
  },
): GasOrder {
  let order: GasOrder | null = null;

  if (orderId) {
    order = getGasOrder(orderId);
  } else if (input.depositorAddress) {
    order = findOpenOrderForDepositor(input.depositorAddress, input.depositChainId);
  }

  if (!order) {
    throw new Error("Gas sipariş fişi bulunamadı — önce ATEŞLE ile sipariş oluşturun");
  }

  const now = Date.now();
  if (order.status === "delivered") {
    return order;
  }
  if (order.status !== "awaiting_payment" || order.expiresAt <= now) {
    throw new Error(`Sipariş fişi geçersiz (${order.orderId} — ${order.status})`);
  }

  if (order.targetAsset !== input.targetAsset) {
    throw new Error("Sipariş fişi ile teslimat tokenı uyuşmuyor");
  }
  if (order.targetAddress.toLowerCase() !== input.targetAddress.trim().toLowerCase()) {
    throw new Error("Sipariş fişi ile hedef adres uyuşmuyor");
  }
  if (Math.abs(order.packageAmount - input.packageAmount) > 0.000001) {
    throw new Error("Sipariş fişi ile ödeme tutarı uyuşmuyor");
  }
  if (
    input.depositorAddress &&
    order.depositorAddress !== input.depositorAddress.trim().toLowerCase()
  ) {
    throw new Error("Sipariş fişi bu cüzdana ait değil");
  }
  if (order.depositChainId !== input.depositChainId) {
    throw new Error("Sipariş fişi ile ödeme ağı uyuşmuyor");
  }

  return order;
}

export function markOrderDelivered(
  orderId: string,
  depositTxHash: string,
  deliveryTxHash: string,
): void {
  const store = loadStore();
  const hit = store.orders.find((o) => o.orderId === orderId);
  if (!hit) return;
  hit.status = "delivered";
  hit.depositTxHash = depositTxHash;
  hit.deliveryTxHash = deliveryTxHash;
  hit.deliveredAt = Date.now();
  saveStore(prune(store));
}

export function markOrderFailed(orderId: string, reason: string): void {
  const store = loadStore();
  const hit = store.orders.find((o) => o.orderId === orderId);
  if (!hit) return;
  hit.status = "failed";
  hit.failReason = reason;
  saveStore(prune(store));
}

export function listOpenOrders(limit = 50): GasOrder[] {
  const now = Date.now();
  return prune(loadStore())
    .orders.filter((o) => o.status === "awaiting_payment" && o.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

/** Eski intent API uyumluluğu */
export function orderIdToLegacyIntentId(orderId: string): string {
  return orderId;
}
