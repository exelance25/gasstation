import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Hash } from "viem";

type StoredDeposit = { deliveryTxHash: string; at: number };

type IdempotencyStore = {
  txHashes: string[];
  deposits: Record<string, StoredDeposit>;
};

const MAX_ENTRIES = 5_000;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** In-memory fallback (dev / serverless cold start) */
const processedTxHashes = new Set<string>();
const processedDeposits = new Map<string, StoredDeposit>();

let storeLoaded = false;

function resolveStorePath(): string | null {
  const configured = process.env.DISPENSE_IDEMPOTENCY_FILE?.trim();
  if (configured) return resolve(configured);
  /* Vercel/Lambda — disk yazılamaz; bellek içi idempotency yeterli */
  if (process.env.VERCEL ?? process.env.AWS_LAMBDA_FUNCTION_NAME) return null;
  if (process.env.NODE_ENV === "production") {
    return resolve(process.cwd(), ".data", "dispense-processed.json");
  }
  return null;
}

function normalizeHash(txHash: Hash | string): string {
  return txHash.startsWith("0x") ? txHash.toLowerCase() : txHash;
}

function depositKey(chainId: number, txHash: Hash | string): string {
  return `${chainId}:${normalizeHash(txHash)}`;
}

function emptyStore(): IdempotencyStore {
  return { txHashes: [], deposits: {} };
}

function loadStoreFromDisk(path: string): IdempotencyStore {
  if (!existsSync(path)) return emptyStore();
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as IdempotencyStore;
    if (!Array.isArray(parsed.txHashes) || typeof parsed.deposits !== "object") {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function pruneStore(store: IdempotencyStore): IdempotencyStore {
  const now = Date.now();
  const deposits: Record<string, StoredDeposit> = {};
  const txHashes: string[] = [];

  for (const [key, value] of Object.entries(store.deposits)) {
    if (now - value.at <= TTL_MS) {
      deposits[key] = value;
      const hash = key.split(":")[1];
      if (hash) txHashes.push(hash);
    }
  }

  const unique = [...new Set(txHashes.map(normalizeHash))];
  return { txHashes: unique.slice(-MAX_ENTRIES), deposits };
}

function persistStore(path: string, store: IdempotencyStore): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(pruneStore(store), null, 2), "utf8");
  } catch {
    /* ephemeral runtime — bellek yeterli */
  }
}

function hydrateMemoryFromStore(store: IdempotencyStore): void {
  processedTxHashes.clear();
  processedDeposits.clear();
  for (const hash of store.txHashes) processedTxHashes.add(normalizeHash(hash));
  for (const [key, value] of Object.entries(store.deposits)) {
    processedDeposits.set(key, value);
  }
}

function ensureLoaded(): void {
  if (storeLoaded) return;
  const path = resolveStorePath();
  if (path) {
    hydrateMemoryFromStore(loadStoreFromDisk(path));
  }
  storeLoaded = true;
}

function pruneOldEntries(): void {
  if (processedDeposits.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, value] of processedDeposits) {
    if (now - value.at > TTL_MS) {
      processedDeposits.delete(key);
      const hash = key.split(":")[1];
      if (hash) processedTxHashes.delete(hash);
    }
  }
}

export function isTxHashAlreadyProcessed(txHash: Hash | string): boolean {
  ensureLoaded();
  return processedTxHashes.has(normalizeHash(txHash));
}

export function getProcessedDeposit(
  chainId: number,
  txHash: Hash | string,
): { deliveryTxHash: string } | null {
  ensureLoaded();
  const hit = processedDeposits.get(depositKey(chainId, txHash));
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    processedDeposits.delete(depositKey(chainId, txHash));
    processedTxHashes.delete(normalizeHash(txHash));
    return null;
  }
  return { deliveryTxHash: hit.deliveryTxHash };
}

export function markDepositProcessed(
  chainId: number,
  txHash: Hash | string,
  deliveryTxHash: string,
): void {
  ensureLoaded();
  pruneOldEntries();
  const normalized = normalizeHash(txHash);
  const key = depositKey(chainId, txHash);
  const entry: StoredDeposit = { deliveryTxHash, at: Date.now() };

  processedTxHashes.add(normalized);
  processedDeposits.set(key, entry);

  const path = resolveStorePath();
  if (!path) return;

  const store = loadStoreFromDisk(path);
  if (!store.txHashes.includes(normalized)) {
    store.txHashes.push(normalized);
  }
  store.deposits[key] = entry;
  persistStore(path, store);
}

export type ProcessedDepositRow = {
  chainId: number;
  depositTxHash: string;
  deliveryTxHash: string;
  at: number;
};

export function listRecentProcessedDeposits(limit = 40): ProcessedDepositRow[] {
  ensureLoaded();
  const rows: ProcessedDepositRow[] = [];
  for (const [key, value] of processedDeposits) {
    const colon = key.indexOf(":");
    if (colon < 0) continue;
    const chainId = Number(key.slice(0, colon));
    const hash = key.slice(colon + 1);
    if (!Number.isFinite(chainId) || !hash) continue;
    if (Date.now() - value.at > TTL_MS) continue;
    rows.push({
      chainId,
      depositTxHash: hash.startsWith("0x") ? hash : hash,
      deliveryTxHash: value.deliveryTxHash,
      at: value.at,
    });
  }
  return rows.sort((a, b) => b.at - a.at).slice(0, limit);
}
