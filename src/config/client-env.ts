import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "testnet", "mainnet"])
    .default("development"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000/api"),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string().min(1).default("replace_wallet_connect_key"),
  NEXT_PUBLIC_WC_ENABLED: z
    .preprocess((v) => v === "true" || v === true, z.boolean())
    .optional()
    .default(false),
  NEXT_PUBLIC_ETH_MAINNET_RPC: z
    .string()
    .url()
    .default("https://ethereum-rpc.publicnode.com"),
  NEXT_PUBLIC_ETH_SEPOLIA_RPC: z
    .string()
    .url()
    .default("https://ethereum-sepolia-rpc.publicnode.com"),
  NEXT_PUBLIC_BASE_RPC: z.string().url().optional(),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: z.string().url().optional(),
  NEXT_PUBLIC_MONAD_TESTNET_RPC: z
    .string()
    .url()
    .default("https://testnet-rpc.monad.xyz"),
  NEXT_PUBLIC_MONAD_MAINNET_RPC: z.string().url().optional(),
  NEXT_PUBLIC_MONAD_USDC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_SOLANA_MAINNET_RPC: z
    .string()
    .url()
    .default("https://api.mainnet-beta.solana.com"),
  NEXT_PUBLIC_SOLANA_DEVNET_RPC: z
    .string()
    .url()
    .default("https://api.devnet.solana.com"),
  NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_PUMP_TREASURY_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_COLLECTOR_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_SOLANA_VAULT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ENTRY_POINT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_BASE_USDC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_BASE_USDT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_POOL_MON_TOKEN_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ARC_TESTNET_RPC: z.string().url().optional(),
  NEXT_PUBLIC_ARC_USDC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_AUTO_FEE_ENABLED: z
    .preprocess((v) => v === "true" || v === true, z.boolean())
    .optional()
    .default(false),
  NEXT_PUBLIC_SOLANA_GAS_ENABLED: z
    .preprocess((v) => v === "true" || v === true, z.boolean())
    .optional()
    .default(false),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  NEXT_PUBLIC_WC_ENABLED: process.env.NEXT_PUBLIC_WC_ENABLED,
  NEXT_PUBLIC_ETH_MAINNET_RPC: process.env.NEXT_PUBLIC_ETH_MAINNET_RPC,
  NEXT_PUBLIC_ETH_SEPOLIA_RPC: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC,
  NEXT_PUBLIC_BASE_RPC:
    process.env.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org",
  NEXT_PUBLIC_BASE_SEPOLIA_RPC:
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
  NEXT_PUBLIC_MONAD_TESTNET_RPC: process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC,
  NEXT_PUBLIC_MONAD_MAINNET_RPC:
    process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC ?? "https://rpc.monad.xyz",
  NEXT_PUBLIC_MONAD_USDC_ADDRESS: process.env.NEXT_PUBLIC_MONAD_USDC_ADDRESS,
  NEXT_PUBLIC_SOLANA_MAINNET_RPC: process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC,
  NEXT_PUBLIC_SOLANA_DEVNET_RPC: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC,
  NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS: process.env.NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS,
  NEXT_PUBLIC_PUMP_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_PUMP_TREASURY_ADDRESS,
  NEXT_PUBLIC_COLLECTOR_ADDRESS: process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS,
  NEXT_PUBLIC_SOLANA_VAULT_ADDRESS: process.env.NEXT_PUBLIC_SOLANA_VAULT_ADDRESS,
  NEXT_PUBLIC_ENTRY_POINT_ADDRESS: process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS,
  NEXT_PUBLIC_BASE_USDC_ADDRESS: process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS,
  NEXT_PUBLIC_BASE_USDT_ADDRESS: process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS,
  NEXT_PUBLIC_POOL_MON_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_POOL_MON_TOKEN_ADDRESS,
  NEXT_PUBLIC_ARC_TESTNET_RPC: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC,
  NEXT_PUBLIC_ARC_USDC_ADDRESS: process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS,
  NEXT_PUBLIC_AUTO_FEE_ENABLED: process.env.NEXT_PUBLIC_AUTO_FEE_ENABLED,
  NEXT_PUBLIC_SOLANA_GAS_ENABLED: process.env.NEXT_PUBLIC_SOLANA_GAS_ENABLED,
});

if (!parsed.success && process.env.NODE_ENV === "development") {
  console.warn("[client-env] Eksik env — varsayılanlar kullanılıyor:", parsed.error.flatten());
}

export const clientEnv = parsed.success
  ? parsed.data
  : clientEnvSchema.parse({});

export function isAutoFeeEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTO_FEE_ENABLED;
  if (raw === "false") return false;
  if (raw === "true") return true;
  return false;
}

const FORBIDDEN_CLIENT_KEYS = [
  "API_SECRET",
  "PRIVATE_KEY",
  "SECRET_KEY",
  "SOLANA_PRIVATE",
  "OPERATOR",
  "MNEMONIC",
  "SESSION_ENCRYPTION",
  "WALLETCONNECT_SECRET",
];

export function validatePublicEnvKeys(): void {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const upper = key.toUpperCase();
    if (FORBIDDEN_CLIENT_KEYS.some((f) => upper.includes(f))) {
      throw new Error(`Unsafe NEXT_PUBLIC variable detected: ${key}`);
    }
  }
}
