import { encodeFunctionData, type Address, type Hex } from "viem";
import { pumpPaymasterAbi } from "@/lib/contracts/pump-paymaster-abi";

/**
 * ERC-4337 SimpleAccount.execute — pump işlemi için minimal çağrı.
 * Üretimde hedef kontrat + calldata buraya bağlanır.
 */
export function buildPumpCallData(): Hex {
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "execute",
        inputs: [
          { name: "dest", type: "address" },
          { name: "value", type: "uint256" },
          { name: "func", type: "bytes" },
        ],
        outputs: [],
      },
    ],
    functionName: "execute",
    args: ["0x0000000000000000000000000000000000000000", 0n, "0x"],
  });
}

const accountExecuteAbi = [
  {
    type: "function",
    name: "execute",
    inputs: [
      { name: "dest", type: "address" },
      { name: "value", type: "uint256" },
      { name: "func", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/** Smart account üzerinden PumpPaymaster.buyGasManuel */
export function buildBuyGasManuelUserOpCallData(params: {
  paymaster: Address;
  tokenPaid: Address;
  amountPaidWei: bigint;
  expectedGasWei: bigint;
  recipient: Address;
}): Hex {
  const inner = encodeFunctionData({
    abi: pumpPaymasterAbi,
    functionName: "buyGasManuel",
    args: [
      params.tokenPaid,
      params.amountPaidWei,
      params.expectedGasWei,
      params.recipient,
    ],
  });

  return encodeFunctionData({
    abi: accountExecuteAbi,
    functionName: "execute",
    args: [params.paymaster, 0n, inner],
  });
}
