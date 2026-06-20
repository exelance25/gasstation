import { Router } from "express";
import { z } from "zod";
import { handlePaymentWebhook } from "../../workers/payment-monitor.js";

export const webhooksRouter = Router();

const webhookSchema = z.object({
  orderId: z.string().uuid(),
  txHash: z.string().min(32),
  chain: z.string(),
});

webhooksRouter.post("/payment", async (req, res) => {
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Geçersiz webhook" });
    return;
  }
  try {
    await handlePaymentWebhook(parsed.data);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook işlenemedi";
    res.status(500).json({ error: message });
  }
});
