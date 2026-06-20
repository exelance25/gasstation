import "server-only";

import { encodeAbiParameters, keccak256, type Address, type Hex } from "viem";
import { privateKeyToAccount, signMessage } from "viem/accounts";

function getPriceSignerKey(): Hex | null {
  const raw = (
    process.env.PRICE_SIGNER_PRIVATE_KEY ??
    process.env.RELAYER_PRIVATE_KEY
  )?.trim();
  if (!raw || raw.length < 64) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

export function getPriceSignerAddress(): Address | null {
  const key = getPriceSignerKey();
  if (!key) return null;
  return privateKeyToAccount(key).address;
}

export function buildQuoteStructHash(params: {
  user: Address;
  tokenToPay: Address;
  maxTokenCharge: bigint;
  deadline: bigint;
  maxNativeCost: bigint;
  chainId: number;
  paymaster: Address;
}): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        params.user,
        params.tokenToPay,
        params.maxTokenCharge,
        params.deadline,
        params.maxNativeCost,
        BigInt(params.chainId),
        params.paymaster,
      ],
    ),
  );
}

export async function signPaymasterQuote(params: {
  user: Address;
  tokenToPay: Address;
  maxTokenCharge: bigint;
  deadline: bigint;
  maxNativeCost: bigint;
  chainId: number;
  paymaster: Address;
}): Promise<Hex> {
  const key = getPriceSignerKey();
  if (!key) {
    throw new Error("PRICE_SIGNER_PRIVATE_KEY yapılandırılmamış");
  }
  const structHash = buildQuoteStructHash(params);
  return signMessage({ privateKey: key, message: { raw: structHash } });
}
