import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { SettlementStatus } from "../types/settlement.js";

export type SettlementRecord = {
  settlementId: string;
  quoteId: string;
  status: SettlementStatus;
  paymentTxHash: string;
  deliveryTxHash: string | null;
  payerAddress: string;
  beneficiaryAddress: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
};

const memory = new Map<string, SettlementRecord>();
const usedPayments = new Set<string>();

function storePath(): string {
  return resolve(process.cwd(), ".data", "settlements.json");
}

function load(): SettlementRecord[] {
  const path = storePath();
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf8")) as SettlementRecord[];
  } catch {
    return [];
  }
}

function save(records: SettlementRecord[]): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(records, null, 2), "utf8");
}

export function isPaymentTxUsed(txHash: string): boolean {
  return usedPayments.has(txHash.toLowerCase());
}

export function markPaymentTxUsed(txHash: string): void {
  usedPayments.add(txHash.toLowerCase());
  for (const r of load()) {
    if (r.paymentTxHash.toLowerCase() === txHash.toLowerCase()) {
      usedPayments.add(txHash.toLowerCase());
    }
  }
}

export function createSettlement(
  record: Omit<SettlementRecord, "createdAt" | "updatedAt">,
): SettlementRecord {
  const now = new Date().toISOString();
  const full: SettlementRecord = { ...record, createdAt: now, updatedAt: now };
  memory.set(full.settlementId, full);
  const all = load().filter((r) => r.settlementId !== full.settlementId);
  all.push(full);
  save(all);
  return full;
}

export function updateSettlement(
  settlementId: string,
  patch: Partial<SettlementRecord>,
): SettlementRecord | null {
  const existing = memory.get(settlementId) ?? load().find((r) => r.settlementId === settlementId);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  memory.set(settlementId, updated);
  const all = load().map((r) => (r.settlementId === settlementId ? updated : r));
  save(all);
  return updated;
}

export function getSettlement(settlementId: string): SettlementRecord | null {
  return memory.get(settlementId) ?? load().find((r) => r.settlementId === settlementId) ?? null;
}

// hydrate
for (const r of load()) {
  memory.set(r.settlementId, r);
  usedPayments.add(r.paymentTxHash.toLowerCase());
}
