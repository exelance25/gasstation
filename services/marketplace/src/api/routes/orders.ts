import { Router } from "express";
import { z } from "zod";
import {
  createMarketplaceOrder,
  toOrderResponse,
} from "../services/order-service.js";
import { getOrderById } from "../db/orders-repo.js";
import { PACKAGE_AMOUNTS, PAYMENT_CHAINS, DELIVERY_CHAINS } from "../types/order.js";

export const ordersRouter = Router();

const createSchema = z.object({
  paymentChain: z.enum(["ethereum", "base", "monad"]),
  paymentToken: z.string().default("USDC"),
  paymentAmount: z.union([z.literal(0.05), z.literal(0.1), z.literal(0.2)]),
  destinationChain: z.enum(["ethereum", "base", "monad", "solana"]),
  destinationAddress: z.string().min(1).max(128),
});

ordersRouter.post("/create", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Geçersiz istek", details: parsed.error.flatten() });
    return;
  }
  try {
    const order = await createMarketplaceOrder({
      paymentChain: parsed.data.paymentChain,
      paymentToken: parsed.data.paymentToken,
      paymentAmount: parsed.data.paymentAmount,
      destinationChain: parsed.data.destinationChain,
      destinationAddress: parsed.data.destinationAddress,
    });
    res.status(201).json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sipariş oluşturulamadı";
    res.status(400).json({ error: message });
  }
});

ordersRouter.get("/:id", async (req, res) => {
  const row = await getOrderById(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Sipariş bulunamadı" });
    return;
  }
  res.json(toOrderResponse(row));
});

ordersRouter.get("/:id/status", async (req, res) => {
  const row = await getOrderById(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Sipariş bulunamadı" });
    return;
  }
  res.json({
    orderId: row.order_id,
    status: row.status,
    paymentTxHash: row.payment_tx_hash,
    deliveryTxHash: row.delivery_tx_hash,
    expiresAt: row.expires_at.toISOString(),
    failureReason: row.failure_reason,
  });
});

ordersRouter.get("/meta/packages", (_req, res) => {
  res.json({ packages: PACKAGE_AMOUNTS, paymentChains: PAYMENT_CHAINS, deliveryChains: DELIVERY_CHAINS });
});
