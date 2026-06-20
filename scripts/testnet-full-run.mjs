/**
 * GASSTATION — Sepolia + Solana devnet tam test
 * .env.local + .env.test.local yükler (anahtarlar commit edilmez)
 *
 * Kullanım: node scripts/testnet-full-run.mjs
 * Sepolia atla (Solana-only): set SKIP_SEPOLIA=1
 * Sunucu:   node scripts/dev-clean-start.mjs
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
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  http,
  parseAbi,
  parseUnits,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import bs58 from "bs58";

// Dev ortamında TLS proxy sorunları (publicnode vb.)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const PACKAGE_USD = Number(process.env.PACKAGE_USD ?? "5");
const SKIP_SEPOLIA =
  process.env.SKIP_SEPOLIA === "1" || process.env.SKIP_SEPOLIA === "true";
const SEPOLIA_USDC = getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
const SOLANA_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

const report = { steps: [], errors: [], passed: 0, failed: 0 };

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

function log(step, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${step}${detail ? ` — ${detail}` : ""}`);
  report.steps.push({ step, ok, detail });
  if (ok) report.passed++;
  else {
    report.failed++;
    report.errors.push(`${step}: ${detail}`);
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.test.local");

const collector =
  process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS;
const solCollector =
  process.env.SOLANA_COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_SOLANA_VAULT_ADDRESS;
const SEPOLIA_RPC_CANDIDATES = [
  process.env.ETH_RPC_PRIVATE_URL,
  process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://1rpc.io/sepolia",
].filter(Boolean);
const SOLANA_RPC_CANDIDATES = [
  process.env.SOLANA_RPC_PRIVATE_URL,
  process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC,
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
].filter(Boolean);

let solConnection = null;

const depositorPk = process.env.TEST_SEPOLIA_DEPOSITOR_PK;
const solDepositorPk = process.env.TEST_SOLANA_DEPOSITOR_PK;
const sepoliaTarget = process.env.TEST_SEPOLIA_TARGET;
const solanaTarget = process.env.TEST_SOLANA_TARGET;

let sepoliaClient = null;

function initSepoliaClient() {
  const transport = http(SEPOLIA_RPC_CANDIDATES[0]);
  sepoliaClient = createPublicClient({ chain: sepolia, transport });
  log("Sepolia RPC", true, SEPOLIA_RPC_CANDIDATES[0]);
}

async function initSolanaConnection() {
  for (const rpc of SOLANA_RPC_CANDIDATES) {
    try {
      const conn = new Connection(rpc, "confirmed");
      await conn.getSlot();
      solConnection = conn;
      log("Solana RPC", true, rpc);
      return true;
    } catch {
      /* try next */
    }
  }
  log("Solana RPC", false, "Tüm devnet RPC'ler yanıt vermedi");
  return false;
}

console.log("=== GASSTATION TESTNET TAM KOŞU ===\n");
console.log("API:", API_BASE);
console.log("Paket: $" + PACKAGE_USD);
console.log("Sepolia:", SKIP_SEPOLIA ? "ATLANDI (SKIP_SEPOLIA=1)" : "açık");
console.log("Collector EVM:", collector);
console.log("Collector SOL:", solCollector);
console.log("");

async function healthCheck() {
  try {
    const r = await fetch(`${API_BASE}/api/health`);
    const j = await r.json();
    log("Health API", r.ok && j.ok, `evm_op=${j.operators?.evm} sol_op=${j.operators?.solana} wc=${j.walletConnect}`);
    return r.ok;
  } catch (e) {
    log("Health API", false, e.message);
    return false;
  }
}

async function probeSepolia() {
  if (!sepoliaClient) initSepoliaClient();
  if (!depositorPk?.startsWith("0x")) {
    log("Sepolia depositor key", false, "TEST_SEPOLIA_DEPOSITOR_PK yok");
    return false;
  }
  const account = privateKeyToAccount(depositorPk);
  const eth = await sepoliaClient.getBalance({ address: account.address });
  const usdc = await sepoliaClient.readContract({
    address: SEPOLIA_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  log(
    "Sepolia depositor bakiye",
    true,
    `${formatEther(eth)} ETH · ${formatUnits(usdc, 6)} USDC (${account.address.slice(0, 10)}…)`,
  );
  return usdc >= parseUnits(String(PACKAGE_USD), 6);
}

async function probeSolana() {
  if (!solConnection) return false;
  if (!solDepositorPk) {
    log("Solana depositor key", false, "TEST_SOLANA_DEPOSITOR_PK yok");
    return false;
  }
  const kp = Keypair.fromSecretKey(bs58.decode(solDepositorPk));
  const sol = await solConnection.getBalance(kp.publicKey);
  const usdc = await getSolanaUsdcBalance(kp.publicKey);
  log(
    "Solana depositor bakiye",
    true,
    `${(sol / LAMPORTS_PER_SOL).toFixed(4)} SOL · ${usdc.toFixed(2)} USDC`,
  );
  return usdc >= PACKAGE_USD;
}

async function solanaTopUpIfNeeded() {
  if (!solConnection || !solDepositorPk) return;
  const kp = Keypair.fromSecretKey(bs58.decode(solDepositorPk));
  const bal = await solConnection.getBalance(kp.publicKey);
  if (bal >= 0.05 * LAMPORTS_PER_SOL) {
    log("Solana SOL ücret", true, `${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL mevcut`);
    return;
  }

  const opPk = process.env.SOLANA_PRIVATE_KEY;
  if (opPk) {
    try {
      const op = Keypair.fromSecretKey(bs58.decode(opPk));
      const lamports = Math.floor(0.2 * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: op.publicKey,
          toPubkey: kp.publicKey,
          lamports,
        }),
      );
      const { blockhash, lastValidBlockHeight } = await solConnection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = op.publicKey;
      tx.sign(op);
      const sig = await solConnection.sendRawTransaction(tx.serialize());
      await solConnection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      log("Solana SOL ücret", true, "Operatörden 0.2 SOL");
      return;
    } catch (e) {
      log("Solana operatör top-up", false, e.message);
    }
  }

  for (const rpc of SOLANA_RPC_CANDIDATES) {
    try {
      const conn = new Connection(rpc, "confirmed");
      const sig = await conn.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      log("Solana airdrop", true, `1 SOL (${rpc})`);
      return;
    } catch {
      /* next rpc */
    }
  }
  log("Solana SOL ücret", false, "Faucet limiti — node scripts/fund-testnet-depositors.mjs");
}

async function getSolanaUsdcBalance(owner) {
  const mint = new PublicKey(SOLANA_USDC_MINT);
  const accounts = await solConnection.getParsedTokenAccountsByOwner(owner, { mint });
  let total = 0;
  for (const { account } of accounts.value) {
    const ui = account.data.parsed?.info?.tokenAmount?.uiAmount;
    if (ui != null) total += Number(ui);
  }
  return total;
}

async function deriveAta(owner, mint) {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()],
    ATA_PROGRAM,
  );
  return ata;
}

async function runSepoliaE2E() {
  const account = privateKeyToAccount(depositorPk);
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(SEPOLIA_RPC_CANDIDATES[0]),
  });
  const amount = parseUnits(String(PACKAGE_USD), 6);

  const hash = await wallet.writeContract({
    address: SEPOLIA_USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [collector, amount],
  });
  await sepoliaClient.waitForTransactionReceipt({ hash });
  log("Sepolia USDC depozit", true, hash);

  const r = await fetch(`${API_BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: hash,
      targetAsset: "ETH",
      targetAddress: sepoliaTarget,
      packageAmount: PACKAGE_USD,
    }),
  });
  const body = await r.json();
  if (!r.ok) {
    log("Sepolia dispense API", false, body.error ?? JSON.stringify(body));
    return;
  }
  log(
    "Sepolia dispense API",
    true,
    `gas tx ${body.deliveryTxHash?.slice(0, 14)}… · kasada $${body.treasuryRetainedUsd}`,
  );

  const targetBal = await sepoliaClient.getBalance({ address: sepoliaTarget });
  log("Sepolia hedef ETH", true, formatEther(targetBal));
}

async function runSolanaE2E() {
  if (!solConnection) return;
  const kp = Keypair.fromSecretKey(bs58.decode(solDepositorPk));
  const mint = new PublicKey(SOLANA_USDC_MINT);
  const collectorPk = new PublicKey(solCollector);
  const amountMicro = BigInt(PACKAGE_USD) * 1_000_000n;

  const senderAta = await deriveAta(kp.publicKey, mint);
  const collectorAta = await deriveAta(collectorPk, mint);

  const tx = new Transaction();
  const collectorAtaInfo = await solConnection.getAccountInfo(collectorAta);
  if (!collectorAtaInfo) {
    tx.add(
      new TransactionInstruction({
        programId: ATA_PROGRAM,
        keys: [
          { pubkey: kp.publicKey, isSigner: true, isWritable: true },
          { pubkey: collectorAta, isSigner: false, isWritable: true },
          { pubkey: collectorPk, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
        ],
        data: Buffer.alloc(0),
      }),
    );
  }

  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0);
  data.writeBigUInt64LE(amountMicro, 1);
  tx.add(
    new TransactionInstruction({
      programId: TOKEN_PROGRAM,
      keys: [
        { pubkey: senderAta, isSigner: false, isWritable: true },
        { pubkey: collectorAta, isSigner: false, isWritable: true },
        { pubkey: kp.publicKey, isSigner: true, isWritable: false },
      ],
      data,
    }),
  );

  const { blockhash, lastValidBlockHeight } = await solConnection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = kp.publicKey;
  tx.sign(kp);

  const sig = await solConnection.sendRawTransaction(tx.serialize());
  await solConnection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  log("Solana USDC depozit", true, sig);

  const r = await fetch(`${API_BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: sig,
      targetAsset: "SOL",
      targetAddress: solanaTarget,
      packageAmount: PACKAGE_USD,
    }),
  });
  const body = await r.json();
  if (!r.ok) {
    log("Solana dispense API", false, body.error ?? JSON.stringify(body));
    return;
  }
  log(
    "Solana dispense API",
    true,
    `gas tx ${body.deliveryTxHash?.slice(0, 14)}… · kasada $${body.treasuryRetainedUsd}`,
  );

  const targetBal = await solConnection.getBalance(new PublicKey(solanaTarget));
  log("Solana hedef SOL", true, `${(targetBal / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
}

function printLedgerSummary() {
  const path = resolve(process.cwd(), ".data", "treasury-ledger.jsonl");
  if (!existsSync(path)) {
    log("Kasa defteri", false, ".data/treasury-ledger.jsonl yok");
    return;
  }
  const lines = readFileSync(path, "utf8").trim().split("\n").filter(Boolean);
  const entries = lines.map((l) => JSON.parse(l));
  let deposits = 0;
  let retained = 0;
  for (const e of entries) {
    deposits += e.packageUsd;
    retained += e.treasuryRetainedUsd;
  }
  log(
    "Kasa muhasebe özeti",
    true,
    `${entries.length} işlem · $${deposits.toFixed(2)} tahsil · $${retained.toFixed(2)} kasada kalan`,
  );
}

async function main() {
  const healthy = await healthCheck();
  if (!healthy) {
    console.log("\nSunucu kapalı — önce: node scripts/dev-clean-start.mjs");
    process.exit(1);
  }

  let sepoliaReady = false;
  if (SKIP_SEPOLIA) {
    log("Sepolia E2E", true, "atlandı — Solana devnet yolu (ETH gerekmez)");
  } else {
    try {
      sepoliaReady = await probeSepolia();
    } catch (e) {
      log("Sepolia probe", false, e.message);
    }
    if (!sepoliaReady) {
      log(
        "Sepolia USDC",
        false,
        `Depozitörde min $${PACKAGE_USD} USDC yok — https://faucet.circle.com (Sepolia) veya SKIP_SEPOLIA=1`,
      );
    } else {
      try {
        await runSepoliaE2E();
      } catch (e) {
        log("Sepolia E2E", false, e.message);
      }
    }
  }

  await initSolanaConnection();
  await solanaTopUpIfNeeded();
  const solanaReady = await probeSolana();

  if (!solanaReady) {
    log(
      "Solana USDC",
      false,
      `Depozitörde min $${PACKAGE_USD} USDC yok — spl-token-faucet / Circle devnet`,
    );
  } else {
    try {
      await runSolanaE2E();
    } catch (e) {
      log("Solana E2E", false, e.message);
    }
  }

  printLedgerSummary();

  console.log(`\n=== SONUÇ: ${report.passed} geçti, ${report.failed} başarısız ===`);
  if (report.errors.length) {
    console.log("\nHatalar:");
    for (const e of report.errors) console.log("  -", e);
  }
  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
