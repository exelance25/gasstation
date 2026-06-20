export const pumpPaymasterAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "priceSigner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "entryPoint",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "feeMultiplier",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "bpsDivider",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
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
  {
    type: "function",
    name: "adminAddNativeLiquidity",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "adminAddTokenLiquidity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "adminWithdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ManuelGasPurchased",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "tokenPaid", type: "address", indexed: true },
      { name: "amountPaid", type: "uint256", indexed: false },
      { name: "gasReceived", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AutoGasPaid",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "actualGasCost", type: "uint256", indexed: false },
      { name: "tokenCharged", type: "uint256", indexed: false },
    ],
  },
] as const;

export const NATIVE_FEE_TOKEN =
  "0x0000000000000000000000000000000000000000" as const;

/** %0.5 — sözleşme ile aynı */
export const PAYMASTER_FEE_MULTIPLIER = 10050n;
export const PAYMASTER_BPS_DIVIDER = 10000n;

export function applyPaymasterFee(amountWei: bigint): bigint {
  return (amountWei * PAYMASTER_FEE_MULTIPLIER) / PAYMASTER_BPS_DIVIDER;
}
