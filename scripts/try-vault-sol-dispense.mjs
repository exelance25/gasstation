/**
 * Kasaya (Solana vault) gelen Circle USDC ile dispense dene.
 * Circle faucet vault adresine gönderdiyse imza otomatik bulunur.
 *
 * Kullanım:
 *   node scripts/try-vault-sol-dispense.mjs
 *   node scripts/try-vault-sol-dispense.mjs 10
 *   set DEPOSIT_TX=5abc... && node scripts/try-vault-sol-dispense.mjs 5
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Connection, PublicKey } from "@solana/web3.js";

const PACKAGE_USD = Number(process.argv[2] ?? process.env.PACKAGE_USD ?? "5");
const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const lines = [];
function out(s = "") {
  lines.push(s);
  console.log(s);
}

function loadEnv(name) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function saveLog(code) {
  const dir = resolve(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const text = lines.join("\n") + `\n\nexit=${code}\n`;
  writeFileSync(resolve(dir, "last-dispense-attempt.txt"), text, "utf8");
}

loadEnv(".env.local");
loadEnv(".env.test.local");

const collector =
  process.env.SOLANA_COLLECTOR_ADDRESS ??
  process.env.NEXT_PUBLIC_SOLANA_VAULT_ADDRESS;
const rpc =
  process.env.SOLANA_RPC_PRIVATE_URL ??
  process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC ??
  "https://api.devnet.solana.com";
const mint = USDC_MINT_DEVNET;
const target = process.env.TEST_SOLANA_TARGET ?? collector;
const depositTxOverride = process.env.DEPOSIT_TX?.trim();

function deriveAta(owner, mintPk) {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mintPk.toBuffer()],
    ATA_PROGRAM,
  );
  return ata;
}

async function getUsdcBalance(conn, owner, mintPk) {
  const accounts = await conn.getParsedTokenAccountsByOwner(owner, { mint: mintPk });
  let total = 0;
  for (const { account } of accounts.value) {
    total += Number(account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0);
  }
  return total;
}

function transferToCollectorAta(tx, collectorAta, minMicro) {
  const inner = tx.meta?.innerInstructions ?? [];
  const top = tx.transaction.message.instructions;

  const check = (parsed) => {
    if (!parsed || parsed.type !== "transfer") return null;
    const info = parsed.info;
    if (!info) return null;
    const dest = String(info.destination ?? "");
    const amount = BigInt(String(info.amount ?? "0"));
    if (dest !== collectorAta.toBase58()) return null;
    if (amount < minMicro) return null;
    return amount;
  };

  for (const ix of top) {
    if ("parsed" in ix && ix.program === "spl-token") {
      const ok = check(ix.parsed);
      if (ok) return ok;
    }
  }
  for (const group of inner) {
    for (const ix of group.instructions) {
      if ("parsed" in ix && ix.program === "spl-token") {
        const ok = check(ix.parsed);
        if (ok) return ok;
      }
    }
  }
  return null;
}

async function findDepositSignature(conn, collectorAta, minMicro) {
  if (depositTxOverride) {
    const tx = await conn.getParsedTransaction(depositTxOverride, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx || tx.meta?.err) return null;
    const amt = transferToCollectorAta(tx, collectorAta, minMicro);
    if (amt) return { signature: depositTxOverride, amountMicro: amt };
    return null;
  }

  const sigs = await conn.getSignaturesForAddress(collectorAta, { limit: 40 });
  for (const { signature } of sigs) {
    const tx = await conn.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx || tx.meta?.err) continue;
    const amt = transferToCollectorAta(tx, collectorAta, minMicro);
    if (amt) return { signature, amountMicro: amt };
  }
  return null;
}

async function main() {
  if (!collector) {
    out("Solana collector adresi yok");
    saveLog(1);
    process.exit(1);
  }

  const conn = new Connection(rpc, "confirmed");
  const collectorPk = new PublicKey(collector);
  const mintPk = new PublicKey(mint);
  const collectorAta = deriveAta(collectorPk, mintPk);
  const minMicro = BigInt(PACKAGE_USD) * 1_000_000n;

  out("=== Vault Solana USDC → SOL dispense ===\n");
  out(`Vault: ${collector}`);
  out(`Vault USDC ATA: ${collectorAta.toBase58()}`);
  out(`Paket: $${PACKAGE_USD}`);
  out(`Hedef SOL: ${target}`);
  out(`RPC: ${rpc}\n`);

  const bal = await getUsdcBalance(conn, collectorPk, mintPk);
  out(`Vault USDC bakiye: ${bal.toFixed(2)}`);

  if (bal < PACKAGE_USD) {
    out(`\n✗ Vault'ta en az $${PACKAGE_USD} USDC yok.`);
    out("Circle devnet faucet ile vault adresine USDC gönderin.");
    saveLog(1);
    process.exit(1);
  }

  try {
    const health = await fetch(`${API_BASE}/api/health`);
    const hj = await health.json();
    if (!health.ok || !hj.ok) throw new Error("health fail");
    out(`✓ Dev sunucusu: env=${hj.env} sol_op=${hj.operators?.solana}`);
  } catch {
    out("✗ Dev sunucusu kapalı — .\\dev.cmd ile başlatın");
    saveLog(1);
    process.exit(1);
  }

  const deposit = await findDepositSignature(conn, collectorAta, minMicro);
  if (!deposit) {
    out(`\n✗ $${PACKAGE_USD} USDC depozit imzası bulunamadı.`);
    out("Solana explorer'dan vault'a gelen transfer imzasını kopyalayın:");
    out(`  set DEPOSIT_TX=<imza> && node scripts/try-vault-sol-dispense.mjs ${PACKAGE_USD}`);
    saveLog(1);
    process.exit(1);
  }

  out(`\n✓ Depozit imzası: ${deposit.signature}`);
  out(`  Transfer micro-USDC: ${deposit.amountMicro}`);

  const r = await fetch(`${API_BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: deposit.signature,
      targetAsset: "SOL",
      targetAddress: target,
      packageAmount: PACKAGE_USD,
    }),
  });
  const body = await r.json();
  out(`\nDispense HTTP ${r.status}`);
  out(JSON.stringify(body, null, 2));

  if (!r.ok) {
    saveLog(1);
    process.exit(1);
  }

  const targetBal = await conn.getBalance(new PublicKey(target));
  out(`\n✓ BAŞARILI — hedef SOL: ${(targetBal / 1e9).toFixed(6)}`);
  out(`✓ Kasada kalan (USD): ${body.treasuryRetainedUsd}`);
  out(`✓ Gas tx: ${body.deliveryTxHash}`);
  saveLog(0);
}

main().catch((e) => {
  out(`FATAL: ${e.message ?? e}`);
  saveLog(1);
  process.exit(1);
});
