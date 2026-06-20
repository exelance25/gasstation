import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { getEnv } from "../config/env.js";
import { buildFeeQuote } from "../services/quote-builder.js";
import { PAYMENT_TOKENS } from "../types/quote.js";
import { isQuoteUsed, markQuoteUsed } from "../services/quote-store.js";
import { buildQuoteDigest } from "../services/quote-signer.js";
import { privateKeyToAccount } from "viem/accounts";
import { verifyMessage } from "viem";

const CHAINS = [
  "ethereum",
  "base",
  "monad",
  "solana",
  "ethereum-sepolia",
  "base-sepolia",
  "monad-testnet",
  "solana-devnet",
] as const;

export function createApp() {
  const app = express();
  const env = getEnv();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gasstation-quote-engine", version: "0.2.0" });
  });

  const limiter = rateLimit({ windowMs: 60_000, max: 120 });
  app.use("/v1/quote", limiter);

  const feeSchema = z.object({
    chain: z.enum(CHAINS),
    paymentToken: z.enum(PAYMENT_TOKENS as [string, ...string[]]),
    gasEstimateWei: z.string().regex(/^\d+$/),
    userAddress: z.string().optional(),
  });

  app.post("/v1/quote/fee", async (req, res) => {
    const parsed = feeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz istek", details: parsed.error.flatten() });
      return;
    }
    try {
      const quote = await buildFeeQuote({
        chain: parsed.data.chain,
        paymentToken: parsed.data.paymentToken as typeof PAYMENT_TOKENS[number],
        gasEstimateWei: parsed.data.gasEstimateWei,
        userAddress: parsed.data.userAddress,
      });
      res.json(quote);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quote oluşturulamadı";
      res.status(400).json({ error: message });
    }
  });

  const settleSchema = z.object({
    quoteId: z.string().uuid(),
    chain: z.enum(CHAINS),
    paymentToken: z.enum(PAYMENT_TOKENS as [string, ...string[]]),
    gasEstimateWei: z.string().regex(/^\d+$/),
    paymentAmount: z.string().regex(/^\d+$/),
    expiresAt: z.string(),
    signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  });

  /** SDK / backend — imzalı quote doğrulama + tek kullanımlık */
  app.post("/v1/quote/verify", async (req, res) => {
    const parsed = settleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ valid: false, error: "Geçersiz gövde" });
      return;
    }
    const q = parsed.data;
    if (new Date(q.expiresAt).getTime() < Date.now()) {
      res.status(400).json({ valid: false, error: "Quote süresi doldu" });
      return;
    }
    if (isQuoteUsed(q.quoteId)) {
      res.status(400).json({ valid: false, error: "Quote zaten kullanıldı" });
      return;
    }

    const key = env.PRICE_SIGNER_PRIVATE_KEY?.trim();
    if (!key) {
      res.status(503).json({ valid: false, error: "Signer yapılandırılmamış" });
      return;
    }
    const signer = privateKeyToAccount(
      (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`,
    );
    const digest = buildQuoteDigest({
      quoteId: q.quoteId,
      chain: q.chain,
      paymentToken: q.paymentToken,
      gasEstimateWei: q.gasEstimateWei,
      paymentAmount: q.paymentAmount,
      expiresAt: q.expiresAt,
    });

    const ok = await verifyMessage({
      address: signer.address,
      message: { raw: digest },
      signature: q.signature as `0x${string}`,
    });

    if (!ok) {
      res.status(400).json({ valid: false, error: "Geçersiz imza" });
      return;
    }

    markQuoteUsed(q.quoteId);
    res.json({ valid: true, quoteId: q.quoteId });
  });

  return app;
}
