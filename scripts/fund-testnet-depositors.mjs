/**
 * Testnet depozitör cüzdanlarına SOL (ücret) ve durum raporu.
 * USDC için Circle faucet gerekir — otomatik API yok.
 *
 * Kullanım: node scripts/fund-testnet-depositors.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createPublicClient,
  formatEther,
  formatUnits,
  getAddress,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import bs58 from "bs58";

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const SEPOLIA_USDC = getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
const SOLANA_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const SOL_TOP_UP = 0.2;
const MIN_SOL = 0.05;

const SOLANA_RPCS = [
  process.env.SOLANA_RPC_PRIVATE_URL,
  process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC,
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
].filter(Boolean);

const SEPOLIA_RPC =
  process.env.ETH_RPC_PRIVATE_URL ??
  process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ??
  "https://ethereum-sepolia-rpc.publicnode.com";

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.test.local");

const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);

async function solanaConnection() {
  for (const rpc of SOLANA_RPCS) {
    try {
      const conn = new Connection(rpc, "confirmed");
      await conn.getSlot();
      return conn;
    } catch {
      /* next */
    }
  }
  throw new Error("Solana devnet RPC yanıt vermedi");
}

async function getSolUsdcBalance(conn, owner) {
  const mint = new PublicKey(SOLANA_USDC_MINT);
  const accounts = await conn.getParsedTokenAccountsByOwner(owner, { mint });
  let total = 0;
  for (const { account } of accounts.value) {
    const ui = account.data.parsed?.info?.tokenAmount?.uiAmount;
    if (ui != null) total += Number(ui);
  }
  return total;
}

async function topUpSolFromOperator(conn) {
  const opPk = process.env.SOLANA_PRIVATE_KEY;
  const destAddr = process.env.TEST_SOLANA_DEPOSITOR;
  if (!opPk || !destAddr) {
    console.log("⚠ Solana operatör veya TEST_SOLANA_DEPOSITOR tanımlı değil");
    return;
  }

  const operator = Keypair.fromSecretKey(bs58.decode(opPk));
  const dest = new PublicKey(destAddr);
  const bal = await conn.getBalance(dest);

  if (bal >= MIN_SOL * LAMPORTS_PER_SOL) {
    console.log(`✓ Solana depozitör SOL yeterli: ${(bal / LAMPORTS_PER_SOL).toFixed(4)}`);
    return;
  }

  const lamports = Math.floor(SOL_TOP_UP * LAMPORTS_PER_SOL);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: operator.publicKey,
      toPubkey: dest,
      lamports,
    }),
  );
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = operator.publicKey;
  tx.sign(operator);

  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  const after = await conn.getBalance(dest);
  console.log(`✓ Operatörden ${SOL_TOP_UP} SOL gönderildi → ${(after / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log(`  tx: ${sig}`);
}

async function printOperatorSepolia() {
  const pk = process.env.EVM_OPERATOR_PRIVATE_KEY;
  if (!pk?.startsWith("0x")) return;
  const operator = privateKeyToAccount(pk);
  const client = createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC) });
  const eth = await client.getBalance({ address: operator.address });
  console.log("\n--- Sepolia operatör (gas teslimi) ---");
  console.log("Adres:", operator.address);
  console.log("ETH:", formatEther(eth), "(hedefe ETH göndermek için min ~0.01)");
  if (eth < 10_000_000_000_000_000n) {
    console.log("→ Operatöre Sepolia ETH gerekli — aksi halde dispense başarısız olur");
  }
}

async function printSepoliaStatus() {
  const depositor = process.env.TEST_SEPOLIA_DEPOSITOR;
  if (!depositor) {
    console.log("\n--- Sepolia ---");
    console.log("TEST_SEPOLIA_DEPOSITOR tanımlı değil (.env.test.local.example)");
    return;
  }
  const client = createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC) });
  const eth = await client.getBalance({ address: depositor });
  const usdc = await client.readContract({
    address: SEPOLIA_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [depositor],
  });

  console.log("\n--- Sepolia depozitör ---");
  console.log("Adres:", depositor);
  console.log("ETH:", formatEther(eth), "(gas için min ~0.001)");
  console.log("USDC:", formatUnits(usdc, 6), "(min $5 paket için)");

  if (eth === 0n) {
    console.log("→ Sepolia ETH: https://sepoliafaucet.com veya Alchemy/Infura faucet");
  }
  if (usdc < 5_000_000n) {
    console.log("→ Sepolia USDC: https://faucet.circle.com (Ethereum Sepolia seçin)");
  }
}

async function printSolanaStatus(conn) {
  const depositor = process.env.TEST_SOLANA_DEPOSITOR;
  if (!depositor) {
    console.log("\n--- Solana ---");
    console.log("TEST_SOLANA_DEPOSITOR tanımlı değil");
    return;
  }
  const pk = new PublicKey(depositor);
  const sol = await conn.getBalance(pk);
  const usdc = await getSolUsdcBalance(conn, pk);

  console.log("\n--- Solana devnet depozitör ---");
  console.log("Adres:", depositor);
  console.log("SOL:", (sol / LAMPORTS_PER_SOL).toFixed(4));
  console.log("USDC:", usdc.toFixed(2), "(min $5 paket için)");

  if (usdc < 5) {
    console.log("→ Solana devnet USDC: https://faucet.circle.com (Solana Devnet seçin)");
    console.log("  Mint (doğrulama):", SOLANA_USDC_MINT);
    console.log("  spl-token-faucet.com FARKLI mint kullanır — protokol kabul etmez.");
  }
}

async function main() {
  console.log("=== TESTNET DEPOSITÖR FONLAMA ===\n");
  const conn = await solanaConnection();
  await topUpSolFromOperator(conn);
  await printSolanaStatus(conn);
  await printOperatorSepolia();
  await printSepoliaStatus();
  console.log("\nUSDC yüklendikten sonra: node scripts/testnet-full-run.mjs");
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
