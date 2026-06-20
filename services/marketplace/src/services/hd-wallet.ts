import { HDNodeWallet } from "ethers";
import { getEnv } from "../config/env.js";

let master: HDNodeWallet | null = null;

function getMasterWallet(): HDNodeWallet {
  if (!master) {
    const env = getEnv();
    const mnemonic = env.DEPOSIT_MASTER_MNEMONIC?.trim();
    if (!mnemonic) {
      if (env.APP_ENV === "production" || env.APP_ENV === "staging") {
        throw new Error("DEPOSIT_MASTER_MNEMONIC production/staging ortamında zorunlu");
      }
      master = HDNodeWallet.fromPhrase(
        "test test test test test test test test test test test junk",
      );
    } else {
      master = HDNodeWallet.fromPhrase(mnemonic);
    }
  }
  return master;
}

/** Deterministic EVM deposit address per order — never reused */
export function deriveDepositAddress(derivationIndex: number): string {
  const child = getMasterWallet().derivePath(`m/44'/60'/0'/0/${derivationIndex}`);
  return child.address;
}

export function getDepositPrivateKey(derivationIndex: number): string {
  const child = getMasterWallet().derivePath(`m/44'/60'/0'/0/${derivationIndex}`);
  return child.privateKey;
}
