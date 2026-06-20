import { formatEther } from "viem";
import { getPool } from "../db/pool.js";
import { createEvmClient } from "../blockchain/evm.js";
import { getSolanaBalance } from "../blockchain/solana.js";
import { createQueue, createWorker, QUEUE_NAMES } from "../queues/index.js";
import { getOperatorKey } from "../config/env.js";
import { privateKeyToAccount } from "viem/accounts";

const THRESHOLDS = {
  ethereum: 0.05,
  base: 0.05,
  monad: 50,
  solana: 0.5,
};

async function snapshotTreasury(): Promise<void> {
  const pool = getPool();
  const key = getOperatorKey();

  if (key) {
    const account = privateKeyToAccount(key);
    for (const chain of ["ethereum", "base", "monad"] as const) {
      try {
        const client = createEvmClient(chain);
        const balance = await client.getBalance({ address: account.address });
        const eth = Number(formatEther(balance));
        const threshold = THRESHOLDS[chain];
        await pool.query(
          `INSERT INTO treasury_snapshots (chain, asset, balance, threshold, is_low)
           VALUES ($1,$2,$3,$4,$5)`,
          [chain, chain === "monad" ? "MON" : chain === "base" ? "ETH" : "ETH", eth, threshold, eth < threshold],
        );
      } catch {
        // skip chain errors
      }
    }
  }

  try {
    const sol = await getSolanaBalance();
    await pool.query(
      `INSERT INTO treasury_snapshots (chain, asset, balance, threshold, is_low)
       VALUES ('solana','SOL',$1,$2,$3)`,
      [sol, THRESHOLDS.solana, sol < THRESHOLDS.solana],
    );
  } catch {
    // skip
  }
}

export function startTreasuryMonitorWorker(): ReturnType<typeof createWorker> {
  const q = createQueue(QUEUE_NAMES.TREASURY);
  void q.add("snapshot", {}, { repeat: { every: 60_000 }, removeOnComplete: 50 });
  return createWorker(QUEUE_NAMES.TREASURY, async () => {
    await snapshotTreasury();
  });
}
