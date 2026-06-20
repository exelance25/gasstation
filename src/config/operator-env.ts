import "server-only";

import { isAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

const operatorEnvSchema = z.object({
  EVM_OPERATOR_PRIVATE_KEY: z.string().min(64).optional(),
  OPERATOR_PRIVATE_KEY: z.string().min(64).optional(),
  SOLANA_PRIVATE_KEY: z.string().min(32).optional(),
  COLLECTOR_ADDRESS: z.string().optional(),
  PUMP_TREASURY_EVM_ADDRESS: z.string().optional(),
});

export function getServerCollectorAddress(): Address {
  const parsed = operatorEnvSchema.parse({
    EVM_OPERATOR_PRIVATE_KEY: process.env.EVM_OPERATOR_PRIVATE_KEY,
    OPERATOR_PRIVATE_KEY: process.env.OPERATOR_PRIVATE_KEY,
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
    COLLECTOR_ADDRESS: process.env.COLLECTOR_ADDRESS,
    PUMP_TREASURY_EVM_ADDRESS: process.env.PUMP_TREASURY_EVM_ADDRESS,
  });

  const candidates = [
    parsed.COLLECTOR_ADDRESS,
    process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS,
    parsed.PUMP_TREASURY_EVM_ADDRESS,
    process.env.NEXT_PUBLIC_PUMP_TREASURY_ADDRESS,
    process.env.NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS,
  ];

  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed && isAddress(trimmed)) return trimmed as Address;
  }

  throw new Error(
    "Collector adresi yapılandırılmamış — COLLECTOR_ADDRESS veya NEXT_PUBLIC_COLLECTOR_ADDRESS",
  );
}

/** @deprecated getServerCollectorAddress kullanın */
export function getServerTreasuryAddress(): Address {
  return getServerCollectorAddress();
}

export function getOperatorPrivateKey(): Hex {
  const key = (
    process.env.EVM_OPERATOR_PRIVATE_KEY ?? process.env.OPERATOR_PRIVATE_KEY
  )?.trim();
  if (!key || key.length < 64) {
    throw new Error("EVM_OPERATOR_PRIVATE_KEY tanımlı değil");
  }
  return (key.startsWith("0x") ? key : `0x${key}`) as Hex;
}

export function isOperatorConfigured(): boolean {
  const key = (
    process.env.EVM_OPERATOR_PRIVATE_KEY ?? process.env.OPERATOR_PRIVATE_KEY
  )?.trim();
  return Boolean(key && key.length >= 64);
}

export function isSolanaOperatorConfigured(): boolean {
  const key = process.env.SOLANA_PRIVATE_KEY?.trim();
  return Boolean(key && key.length >= 32);
}

export function getSolanaPrivateKeyRaw(): string {
  const key = process.env.SOLANA_PRIVATE_KEY?.trim();
  if (!key) {
    throw new Error("SOLANA_PRIVATE_KEY tanımlı değil");
  }
  return key;
}

export function getCollectorAddressSafe(): Address | null {
  try {
    return getServerCollectorAddress();
  } catch {
    return null;
  }
}

export function getOperatorAddressSafe(): Address | null {
  try {
    return privateKeyToAccount(getOperatorPrivateKey()).address;
  } catch {
    return null;
  }
}
