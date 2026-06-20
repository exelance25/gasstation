import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./api/app.js";
import { getEnv } from "./config/env.js";
import { getPool, closePool } from "./db/pool.js";
import { closeQueues } from "./queues/index.js";
import { startPaymentMonitorWorker } from "./workers/payment-monitor.js";
import { startFulfillmentWorker } from "./workers/fulfillment.js";
import { startTreasuryMonitorWorker } from "./workers/treasury-monitor.js";
import { startExpiryWorker } from "./workers/order-expiry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  const sql = readFileSync(join(__dirname, "db", "schema.sql"), "utf8");
  await getPool().query(sql);
}

async function main(): Promise<void> {
  const env = getEnv();
  await runMigrations();

  const workers = [
    startPaymentMonitorWorker(),
    startFulfillmentWorker(),
    startTreasuryMonitorWorker(),
    startExpiryWorker(),
  ];

  const app = createApp();
  const server = app.listen(env.MARKETPLACE_PORT, () => {
    console.log(`[GASSTATION] Marketplace API :${env.MARKETPLACE_PORT}`);
  });

  const shutdown = async () => {
    console.log("[GASSTATION] Kapatılıyor...");
    server.close();
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues();
    await closePool();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[GASSTATION] Başlatma hatası:", err);
  process.exit(1);
});
