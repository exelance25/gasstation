import "server-only";

const FORBIDDEN_PUBLIC_KEY_FRAGMENTS = [
  "PRIVATE_KEY",
  "SECRET_KEY",
  "SOLANA_PRIVATE",
  "OPERATOR_PRIVATE",
  "EVM_OPERATOR",
  "TEST_SEPOLIA_DEPOSITOR_PK",
  "TEST_SOLANA_DEPOSITOR_PK",
  "TEST_DEPOSITOR",
  "DEPLOYER_PRIVATE",
  "RELAYER_PRIVATE",
  "MNEMONIC",
  "SEED_PHRASE",
  "WALLETCONNECT_SECRET",
] as const;

const SERVER_ONLY_SECRET_KEYS = [
  "EVM_OPERATOR_PRIVATE_KEY",
  "OPERATOR_PRIVATE_KEY",
  "SOLANA_PRIVATE_KEY",
  "RELAYER_PRIVATE_KEY",
  "TEST_SEPOLIA_DEPOSITOR_PK",
  "TEST_SOLANA_DEPOSITOR_PK",
  "TEST_DEPOSITOR_PRIVATE_KEY",
  "DEPOSITOR_PRIVATE_KEY",
] as const;

const HEX_PRIVATE_KEY_PATTERN = /^(0x)?[0-9a-fA-F]{64}$/;
const BASE58_PRIVATE_KEY_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

/**
 * Sunucu başlangıcında: kasa anahtarlarının istemci bundle'ına sızmadığını doğrular.
 */
/** Mainnet/staging: test cüzdan anahtarları sunucuda bulunmamalı */
export function assertNoTestPrivateKeysInProduction(): void {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  if (env !== "mainnet" && env !== "staging") return;

  for (const key of SERVER_ONLY_SECRET_KEYS) {
    if (key.startsWith("TEST_") && process.env[key]?.trim()) {
      throw new Error(
        `Güvenlik ihlali: "${key}" production ortamında tanımlı — test anahtarlarını kaldırın.`,
      );
    }
  }
}

export function assertVaultSecretsNotPublic(): void {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;

    const upper = key.toUpperCase();
    for (const fragment of FORBIDDEN_PUBLIC_KEY_FRAGMENTS) {
      if (upper.includes(fragment)) {
        throw new Error(
          `Güvenlik ihlali: "${key}" sunucu sırrı içeriyor — NEXT_PUBLIC_ önekini kaldırın.`,
        );
      }
    }

    const value = process.env[key]?.trim() ?? "";
    if (!value) continue;

    if (HEX_PRIVATE_KEY_PATTERN.test(value)) {
      throw new Error(
        `Güvenlik ihlali: "${key}" değeri EVM private key formatında — public env'den silin.`,
      );
    }

    if (BASE58_PRIVATE_KEY_PATTERN.test(value) && !upper.includes("ADDRESS")) {
      throw new Error(
        `Güvenlik ihlali: "${key}" değeri Solana secret key formatında — public env'den silin.`,
      );
    }
  }
}
