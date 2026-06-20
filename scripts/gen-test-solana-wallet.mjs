/**
 * Test için Solana devnet cüzdanı üretir (depozitör + hedef).
 * Circle faucet: https://faucet.circle.com → Solana Devnet → USDC
 *
 * Kullanım: node scripts/gen-test-solana-wallet.mjs
 */
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const depositor = Keypair.generate();
const target = Keypair.generate();

console.log("=== Solana test cüzdanları (devnet) ===\n");
console.log("Depozitör (Circle USDC buraya):", depositor.publicKey.toBase58());
console.log("Hedef (SOL gas alacak):", target.publicKey.toBase58());
console.log("\n.env.test.local satırları:\n");
console.log(`TEST_SOLANA_DEPOSITOR=${depositor.publicKey.toBase58()}`);
console.log(`TEST_SOLANA_TARGET=${target.publicKey.toBase58()}`);
console.log(`TEST_SOLANA_DEPOSITOR_PK=${bs58.encode(depositor.secretKey)}`);
console.log("\n⚠ Private key'leri yalnızca .env.test.local dosyasına yazın (git'e girmez).");
console.log("USDC: https://faucet.circle.com → Sol Devnet → depozitör adresi");
console.log("SOL ücreti: node scripts/fund-testnet-depositors.mjs (operatörden otomatik)\n");

const envPath = resolve(process.cwd(), ".env.test.local");
if (!existsSync(envPath)) {
  const template = `# Otomatik üretildi — ${new Date().toISOString()}
TEST_SOLANA_DEPOSITOR=${depositor.publicKey.toBase58()}
TEST_SOLANA_TARGET=${target.publicKey.toBase58()}
TEST_SOLANA_DEPOSITOR_PK=${bs58.encode(depositor.secretKey)}
`;
  writeFileSync(envPath, template, "utf8");
  console.log("✓ .env.test.local oluşturuldu");
} else {
  console.log(".env.test.local zaten var — yukarıdaki satırları elle ekleyin veya dosyayı silip tekrar çalıştırın.");
}
