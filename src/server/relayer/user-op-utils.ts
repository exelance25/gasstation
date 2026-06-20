import { ethers } from "ethers";
import type { UserOperation } from "@/types/user-operation";

export function userOpToTuple(op: UserOperation): [
  string,
  bigint,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  string,
] {
  return [
    op.sender,
    BigInt(op.nonce),
    op.initCode,
    op.callData,
    BigInt(op.callGasLimit),
    BigInt(op.verificationGasLimit),
    BigInt(op.preVerificationGas),
    BigInt(op.maxFeePerGas),
    BigInt(op.maxPriorityFeePerGas),
    op.paymasterAndData,
    op.signature,
  ];
}

export function emptySignature(): string {
  return "0x";
}

export function isValidHexData(value: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

export function assertUserOpShape(op: UserOperation): void {
  if (!ethers.isAddress(op.sender)) {
    throw new Error("Invalid UserOperation.sender");
  }
  for (const field of [
    "initCode",
    "callData",
    "paymasterAndData",
    "signature",
  ] as const) {
    if (!isValidHexData(op[field])) {
      throw new Error(`Invalid UserOperation.${field}`);
    }
  }
}
