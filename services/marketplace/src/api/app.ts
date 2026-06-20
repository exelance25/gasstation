import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getEnv } from "../config/env.js";
import { ordersRouter } from "./routes/orders.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { adminRouter } from "./routes/admin.js";

export function createApp() {
  const app = express();
  const env = getEnv();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gasstation-marketplace" });
  });

  const limiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/orders", limiter, ordersRouter);
  app.use("/webhooks", limiter, webhooksRouter);
  app.use("/admin", adminRouter);

  return app;
}
