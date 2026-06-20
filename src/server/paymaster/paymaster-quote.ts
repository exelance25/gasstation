import "server-only";

import { encodeAbiParameters, concat, parseUnits, type Address, type Hex } from "viem";
import {
  ORACLE_CONSERVATIVE_BUFFER,
  PAYMASTER_FEE_MULTIPLIER,
  PAYMASTER_QUOTE_TTL_SEC,
} from "@config/protocol-fees";
import { getOracleTick } from "@/server/oracle/oracle-service";
import { signPaymasterQuote } from "@/server/paymaster/price-signer";
import { USDC_DECIMALS } from "@/config/pool-tokens";

const BPS = 10000n;

export type PaymasterQuoteInput = {
  user: Address;
  tokenToPay: Address;
  paymaster: Address;
  chainId: number;
  maxNativeCostWei: bigint;
};

export type PaymasterQuoteResult = {
  maxTokenCharge: bigint;
  deadline: bigint;
  maxNativeCostWei: bigint;
  signature: Hex;
  paymasterAndData: Hex;
};

/** Native gas maliyetini (wei) USDC token birimine çevirir + marj */
export async function buildSignedPaymasterQuote(
  input: PaymasterQuoteInput,
): Promise<PaymasterQuoteResult> {
  const tick = await getOracleTick();
  const ethUsd = tick.ETH_Price * (1 + ORACLE_CONSERVATIVE_BUFFER);

  const nativeEth = Number(input.maxNativeCostWei) / 1e18;
  const usdCost = nativeEth * ethUsd;
  const withFeeUsd = usdCost * (Number(PAYMASTER_FEE_MULTIPLIER) / Number(BPS));

  const maxTokenCharge = parseUnits(
    Math.max(withFeeUsd, 0.000001).toFixed(USDC_DECIMALS),
    USDC_DECIMALS,
  );

  const deadline = BigInt(Math.floor(Date.now() / 1000) + PAYMASTER_QUOTE_TTL_SEC);

  const signature = await signPaymasterQuote({
    user: input.user,
    tokenToPay: input.tokenToPay,
    maxTokenCharge,
    deadline,
    maxNativeCost: input.maxNativeCostWei,
    chainId: input.chainId,
    paymaster: input.paymaster,
  });

  const payload = encodeAbiParameters(
    [
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "bytes" },
    ],
    [
      input.user,
      input.tokenToPay,
      maxTokenCharge,
      deadline,
      input.maxNativeCostWei,
      signature,
    ],
  );

  const paymasterAndData = concat([input.paymaster, payload]);

  return {
    maxTokenCharge,
    deadline,
    maxNativeCostWei: input.maxNativeCostWei,
    signature,
    paymasterAndData,
  };
}
