import { encodeFunctionData, parseUnits, type Address, type Hex } from "viem";

export const pumpPaymasterAbi = [
  {
    type: "function",
    name: "buyGasManuel",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenPaid", type: "address" },
      { name: "amountPaid", type: "uint256" },
      { name: "expectedGas", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
] as const;

import type { AmountOption } from "./pricing.js";

export type BuyGasManuelParams = {
  paymaster: Address;
  tokenPaid: Address;
  packageUsd: AmountOption;
  expectedGasWei: bigint;
  recipient: Address;
};

export function encodeBuyGasManuel(params: BuyGasManuelParams): {
  to: Address;
  data: Hex;
  value: bigint;
} {
  const amountPaid = parseUnits(String(params.packageUsd), 6);
  const data = encodeFunctionData({
    abi: pumpPaymasterAbi,
    functionName: "buyGasManuel",
    args: [params.tokenPaid, amountPaid, params.expectedGasWei, params.recipient],
  });
  return { to: params.paymaster, data, value: 0n };
}
