/**
 * Wrapper: map EVM_OPERATOR_PRIVATE_KEY → DEPLOYER_PRIVATE_KEY for Foundry script.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const operator =
  process.env.EVM_OPERATOR_PRIVATE_KEY?.trim() ??
  process.env.OPERATOR_PRIVATE_KEY?.trim() ??
  process.env.DEPLOYER_PRIVATE_KEY?.trim();

if (!operator) {
  console.error("EVM_OPERATOR_PRIVATE_KEY not available in environment.");
  process.exit(1);
}

process.env.DEPLOYER_PRIVATE_KEY = operator.startsWith("0x")
  ? operator.slice(2)
  : operator;

if (process.env.COLLECTOR_ADDRESS && !process.env.PRICE_SIGNER_ADDRESS) {
  process.env.PRICE_SIGNER_ADDRESS = process.env.COLLECTOR_ADDRESS;
}

const contractsDir = resolve(import.meta.dirname, "..", "contracts");
const forge =
  process.env.FORGE_BIN ??
  resolve(process.env.USERPROFILE ?? "", ".foundry", "bin", "forge.exe");

const args = [
  "script",
  "script/DeployPumpPaymaster.s.sol:DeployPumpPaymaster",
  "--rpc-url",
  process.env.MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz",
  "--broadcast",
  "-vvv",
];

const result = spawnSync(forge, args, {
  cwd: contractsDir,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
