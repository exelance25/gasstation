import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";

export type PendingDepositIntent = {
  id: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
  createdAt: number;
  consumedAt?: number;
  depositTxHash?: string;
};

type IntentStore = { intents: PendingDepositIntent[] };

const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_INTENTS = 500;

import { isEphemeralRuntime } from "@/server/gas/signed-ticket";

function storePath(): string | null {
  if (isEphemeralRuntime()) return null;
  const configured = process.env.PENDING_DEPOSIT_INTENTS_FILE?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), ".data", "pending-deposit-intents.json");
}

function loadStore(): IntentStore {
  const path = storePath();
  if (!path || !existsSync(path)) return { intents: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as IntentStore;
    return Array.isArray(parsed.intents) ? parsed : { intents: [] };
  } catch {
    return { intents: [] };
  }
}

function saveStore(store: IntentStore): void {
  const path = storePath();
  if (!path) return;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* Vercel — bellek yeterli */
  }
}

function prune(store: IntentStore): IntentStore {
  const now = Date.now();
  const intents = store.intents
    .filter((i) => !i.consumedAt && now - i.createdAt <= TTL_MS)
    .slice(-MAX_INTENTS);
  return { intents };
}

export function registerPendingDepositIntent(input: {
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
}): PendingDepositIntent {
  const store = prune(loadStore());
  const intent: PendingDepositIntent = {
    id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...input,
    depositorAddress: input.depositorAddress.toLowerCase(),
    createdAt: Date.now(),
  };
  store.intents.push(intent);
  saveStore(store);
  return intent;
}

export function findPendingIntentForDepositor(
  depositorAddress: string,
  depositChainId: number,
): PendingDepositIntent | null {
  const store = prune(loadStore());
  const dep = depositorAddress.toLowerCase();
  const matches = store.intents
    .filter(
      (i) =>
        !i.consumedAt &&
        i.depositorAddress === dep &&
        i.depositChainId === depositChainId,
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  return matches[0] ?? null;
}

export function markIntentConsumed(
  intentId: string,
  depositTxHash: string,
): void {
  const store = loadStore();
  const hit = store.intents.find((i) => i.id === intentId);
  if (!hit) return;
  hit.consumedAt = Date.now();
  hit.depositTxHash = depositTxHash;
  saveStore(prune(store));
}
