import { Router } from "express";
import { getEnv } from "../../config/env.js";
import {
  getRevenueStats,
  listOrders,
} from "../../db/orders-repo.js";
import { toOrderResponse } from "../../services/order-service.js";
import { getPool } from "../../db/pool.js";

export const adminRouter = Router();

function requireAdmin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  const key = getEnv().ADMIN_API_KEY;
  if (!key) {
    res.status(503).json({ error: "Admin API yapılandırılmamış" });
    return;
  }
  const header = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (header !== key) {
    res.status(401).json({ error: "Yetkisiz" });
    return;
  }
  next();
}

adminRouter.use(requireAdmin);

adminRouter.get("/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const rows = await listOrders(100, status as Parameters<typeof listOrders>[1]);
  res.json({ orders: rows.map(toOrderResponse) });
});

adminRouter.get("/revenue", async (_req, res) => {
  const stats = await getRevenueStats();
  res.json(stats);
});

adminRouter.get("/treasury", async (_req, res) => {
  const { rows } = await getPool().query(
    `SELECT DISTINCT ON (chain) chain, asset, balance::text, threshold::text, is_low, checked_at
     FROM treasury_snapshots ORDER BY chain, checked_at DESC`,
  );
  res.json({ balances: rows });
});

adminRouter.get("/failed", async (_req, res) => {
  const rows = await listOrders(50, "FAILED");
  res.json({ orders: rows.map(toOrderResponse) });
});

adminRouter.get("/pending", async (_req, res) => {
  const pending = await listOrders(50, "PENDING_PAYMENT");
  const fulfilling = await listOrders(50, "FULFILLING");
  res.json({
    pendingPayment: pending.map(toOrderResponse),
    fulfilling: fulfilling.map(toOrderResponse),
  });
});
