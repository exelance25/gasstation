/**
 * ERC-4337 v0.6 UserOperation — JSON API ve client/relayer arasında paylaşılan tip.
 * Sayısal alanlar hex string (0x…) olarak taşınır.
 */
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export type PrepareUserOpRequest = {
  sender: string;
  callData?: string;
  initCode?: string;
  usePaymaster?: boolean;
  feeToken?: string;
};

export type PrepareUserOpResponse = {
  userOp: UserOperation;
  userOpHash: string;
};

export type SubmitUserOpRequest = {
  userOp: UserOperation;
  intentId?: string;
};

export type SubmitUserOpResponse = {
  transactionHash: string;
  beneficiary: string;
};
