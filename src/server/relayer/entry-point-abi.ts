/** ERC-4337 EntryPoint v0.6 — minimal ABI */
export const entryPointAbi = [
  "function getUserOpHash((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes) calldata userOp) external view returns (bytes32)",
  "function handleOps((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[] calldata ops, address payable beneficiary) external",
  "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)",
  "function simulateValidation((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes) calldata userOp) external",
] as const;

export const entryPointUserOpTuple = [
  "address",
  "uint256",
  "bytes",
  "bytes",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "bytes",
  "bytes",
] as const;
