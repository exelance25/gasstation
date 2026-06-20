import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "assets");

const logos = {
  "ethereum.png": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  "solana.png": "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  "base.png": "https://assets.coingecko.com/coins/images/31099/small/Base-symbol.png",
  "usdc.png": "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
};

fs.mkdirSync(outDir, { recursive: true });

for (const [name, url] of Object.entries(logos)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`wrote ${name} (${buf.length} bytes)`);
}
