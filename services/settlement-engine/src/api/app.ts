import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { getEnv } from "../config/env.js";
import { settleFee } from "../services/settle-fee.js";
import { prepareSponsorship } from "../services/sponsorship.js";
import { getSettlement } from "../store/settlements.js";

function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const key = getEnv().SETTLEMENT_API_KEY;
  if (!key) {
    if (getEnv().APP_ENV === "production") {
      res.status(503).json({ error: "SETTLEMENT_API_KEY zorunlu" });
      return;
    }
    next();
    return;
  }
  const header =
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ??
    req.headers["x-settlement-api-key"];
  if (header !== key) {
    res.status(401).json({ error: "Yetkisiz" });
    return;
  }
  next();
}

export function createApp() {
  const app = express();
  const env = getEnv();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gasstation-settlement-engine", version: "0.1.0" });
  });

  const limiter = rateLimit({ windowMs: 60_000, max: 60 });
  app.use("/v1", limiter, requireApiKey);

  const settleSchema = z.object({
    quoteId: z.string().uuid(),
    chain: z.string(),
    paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]),
    gasEstimateWei: z.string().regex(/^\d+$/),
    paymentAmount: z.string().regex(/^\d+$/),
    expiresAt: z.string(),
    signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
    paymentTxHash: z.string().min(10),
    payerAddress: z.string().min(10),
    beneficiaryAddress: z.string().min(10),
  });

  app.post("/v1/settle/fee", async (req, res) => {
    const parsed = settleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz istek", details: parsed.error.flatten() });
      return;
    }
    try {
      const result = await settleFee(parsed.data);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Settlement başarısız";
      res.status(400).json({ error: message });
    }
  });

  app.get("/v1/settle/:id", (req, res) => {
    const record = getSettlement(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Settlement bulunamadı" });
      return;
    }
    res.json(record);
  });

  const sponsorSchema = z.object({
    userAddress: z.string(),
    chainId: z.number(),
    intentId: z.string(),
    gasEstimateWei: z.string().optional(),
    paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]).optional(),
  });

  app.post("/v1/sponsor/prepare", async (req, res) => {
    const parsed = sponsorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz istek" });
      return;
    }
    try {
      const result = await prepareSponsorship(parsed.data);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sponsor hazırlık başarısız";
      res.status(400).json({ error: message });
    }
  });

  return app;
}
