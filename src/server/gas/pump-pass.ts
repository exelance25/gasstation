import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { generateTicketId } from "@/server/gas/ticket-id";

export type PumpPassStatus = "active" | "expired";

export type PumpPass = {
  passId: string;
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
  status: PumpPassStatus;
};

type PassStore = { passes: PumpPass[] };

const PASS_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_PASSES = 2_000;

function storePath(): string {
  const configured = process.env.PUMP_PASS_FILE?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), ".data", "pump-passes.json");
}

function loadStore(): PassStore {
  const path = storePath();
  if (!existsSync(path)) return { passes: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as PassStore;
    return Array.isArray(parsed.passes) ? parsed : { passes: [] };
  } catch {
    return { passes: [] };
  }
}

function saveStore(store: PassStore): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
}

function prune(store: PassStore): PassStore {
  const now = Date.now();
  const passes = store.passes
    .map((p) =>
      p.status === "active" && now > p.expiresAt ? { ...p, status: "expired" as const } : p,
    )
    .filter((p) => now - p.createdAt <= PASS_TTL_MS * 2)
    .slice(-MAX_PASSES);
  return { passes };
}

export function issuePumpPass(walletAddress: string): PumpPass {
  const wallet = walletAddress.trim().toLowerCase();
  const store = prune(loadStore());
  const now = Date.now();

  const existing = store.passes
    .filter((p) => p.walletAddress === wallet && p.status === "active" && p.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (existing) return existing;

  const pass: PumpPass = {
    passId: generateTicketId("GP"),
    walletAddress: wallet,
    createdAt: now,
    expiresAt: now + PASS_TTL_MS,
    status: "active",
  };
  store.passes.push(pass);
  saveStore(store);
  return pass;
}

export function getActivePassForWallet(walletAddress: string): PumpPass | null {
  const wallet = walletAddress.trim().toLowerCase();
  const now = Date.now();
  const store = prune(loadStore());
  return (
    store.passes
      .filter((p) => p.walletAddress === wallet && p.status === "active" && p.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
  );
}

export function validatePumpPass(passId: string, walletAddress: string): PumpPass | null {
  const wallet = walletAddress.trim().toLowerCase();
  const now = Date.now();
  const store = prune(loadStore());
  const hit = store.passes.find((p) => p.passId === passId);
  if (!hit) return null;
  if (hit.walletAddress !== wallet) return null;
  if (hit.status !== "active" || hit.expiresAt <= now) return null;
  return hit;
}

export function listActivePasses(limit = 50): PumpPass[] {
  const now = Date.now();
  return prune(loadStore())
    .passes.filter((p) => p.status === "active" && p.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
