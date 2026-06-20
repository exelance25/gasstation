export type PaymentChain = "ethereum" | "base" | "monad";
export type DeliveryChain = "ethereum" | "base" | "monad" | "solana";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "FULFILLING"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "REFUND_PENDING";

export type MarketplaceOrder = {
  orderId: string;
  paymentChain: PaymentChain;
  paymentToken: string;
  paymentAmount: number;
  destinationChain: DeliveryChain;
  destinationAddress: string;
  deliveryAmount: number;
  deliveryAsset: string;
  status: OrderStatus;
  depositAddress: string;
  expiresAt: string;
  paymentTxHash: string | null;
  deliveryTxHash: string | null;
  createdAt: string;
};

export type CreateOrderPayload = {
  paymentChain: PaymentChain;
  paymentToken?: string;
  paymentAmount: 5 | 10 | 20;
  destinationChain: DeliveryChain;
  destinationAddress: string;
};

export type OrderStatusResponse = {
  orderId: string;
  status: OrderStatus;
  paymentTxHash: string | null;
  deliveryTxHash: string | null;
  expiresAt: string;
  failureReason: string | null;
};

const BASE =
  process.env.NEXT_PUBLIC_MARKETPLACE_API_URL ?? "http://localhost:4000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "İstek başarısız");
  return data as T;
}

export function createOrder(payload: CreateOrderPayload): Promise<MarketplaceOrder> {
  return api("/orders/create", { method: "POST", body: JSON.stringify(payload) });
}

export function getOrder(orderId: string): Promise<MarketplaceOrder> {
  return api(`/orders/${orderId}`);
}

export function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  return api(`/orders/${orderId}/status`);
}
