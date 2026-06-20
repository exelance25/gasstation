import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, closePool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  const pool = getPool();
  await pool.query(sql);
  console.log("[migrate] PUMPSTATION marketplace schema ready");
  await closePool();
}

migrate().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
