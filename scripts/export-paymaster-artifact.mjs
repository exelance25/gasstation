import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artifact = JSON.parse(
  readFileSync(
    resolve(root, "contracts/out/PumpPaymaster.sol/PumpPaymaster.json"),
    "utf8",
  ),
);

const abi = artifact.abi.filter(
  (x) =>
    x.type === "constructor" ||
    (x.type === "function" &&
      ["owner", "entryPoint", "priceSigner", "vaultLabel"].includes(x.name)),
);

mkdirSync(resolve(root, "src/server/contracts"), { recursive: true });
writeFileSync(
  resolve(root, "src/server/contracts/pump-paymaster-artifact.ts"),
  `export const pumpPaymasterConstructorAbi = ${JSON.stringify(abi, null, 2)} as const;

export const pumpPaymasterBytecode = "${artifact.bytecode.object}" as const;
`,
);

console.log("Artifact written:", artifact.bytecode.object.length, "byte chars");
