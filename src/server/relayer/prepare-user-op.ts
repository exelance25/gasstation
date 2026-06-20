import "server-only";



import { ethers } from "ethers";

import { isAddress, type Hex } from "viem";

import type { PrepareUserOpRequest, UserOperation } from "@/types/user-operation";

import { entryPointAbi } from "@/server/relayer/entry-point-abi";

import { emptySignature } from "@/server/relayer/user-op-utils";

import { getRelayerConfig } from "@/config/relayer-env";

import { buildPumpCallData } from "@/lib/pump-call-data";

import { getDefaultFeeToken, isFeeTokenConfigured } from "@/config/pool-tokens";

import { buildSignedPaymasterQuote } from "@/server/paymaster/paymaster-quote";

import { getPriceSignerAddress } from "@/server/paymaster/price-signer";



const DEFAULT_CALL_GAS = 120_000n;

const DEFAULT_VERIFICATION_GAS = 180_000n;

const DEFAULT_PRE_VERIFICATION_GAS = 60_000n;



function toHex(value: bigint): string {

  return `0x${value.toString(16)}`;

}



export async function prepareUserOperation(

  input: PrepareUserOpRequest,

  paymasterAddress: string | null,

): Promise<{ userOp: UserOperation; userOpHash: string }> {

  if (!isAddress(input.sender)) {

    throw new Error("Invalid sender address");

  }



  const cfg = getRelayerConfig();

  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);

  const entryPoint = new ethers.Contract(

    cfg.entryPointAddress,

    entryPointAbi,

    provider,

  );



  const nonceBn: bigint = await entryPoint.getNonce(input.sender, 0);

  const feeData = await provider.getFeeData();

  const maxFee = feeData.maxFeePerGas ?? 1_000_000_000n;

  const maxPriority = feeData.maxPriorityFeePerGas ?? 1_000_000_000n;



  const usePaymaster = Boolean(input.usePaymaster && paymasterAddress);

  if (usePaymaster && !isFeeTokenConfigured()) {

    throw new Error("Fee token (USDC/USDT) not configured for automatic paymaster");

  }

  const feeToken = input.feeToken ?? getDefaultFeeToken();



  const callGasLimit = DEFAULT_CALL_GAS;

  const verificationGasLimit = DEFAULT_VERIFICATION_GAS;

  const preVerificationGas = DEFAULT_PRE_VERIFICATION_GAS;

  const maxNativeCostWei =

    (callGasLimit + verificationGasLimit + preVerificationGas) * maxFee;



  let paymasterAndData = "0x";

  if (usePaymaster && paymasterAddress) {

    if (!getPriceSignerAddress()) {

      throw new Error("PRICE_SIGNER_PRIVATE_KEY gerekli — imzalı paymaster quote");

    }

    const network = await provider.getNetwork();

    const quote = await buildSignedPaymasterQuote({

      user: input.sender as Hex,

      tokenToPay: feeToken as Hex,

      paymaster: paymasterAddress as Hex,

      chainId: Number(network.chainId),

      maxNativeCostWei,

    });

    paymasterAndData = quote.paymasterAndData;

  }



  const userOp: UserOperation = {

    sender: input.sender,

    nonce: toHex(nonceBn),

    initCode: input.initCode ?? "0x",

    callData: input.callData ?? buildPumpCallData(),

    callGasLimit: toHex(callGasLimit),

    verificationGasLimit: toHex(verificationGasLimit),

    preVerificationGas: toHex(preVerificationGas),

    maxFeePerGas: toHex(maxFee),

    maxPriorityFeePerGas: toHex(maxPriority),

    paymasterAndData,

    signature: emptySignature(),

  };



  const tuple = [

    userOp.sender,

    BigInt(userOp.nonce),

    userOp.initCode,

    userOp.callData,

    BigInt(userOp.callGasLimit),

    BigInt(userOp.verificationGasLimit),

    BigInt(userOp.preVerificationGas),

    BigInt(userOp.maxFeePerGas),

    BigInt(userOp.maxPriorityFeePerGas),

    userOp.paymasterAndData,

    userOp.signature,

  ] as const;



  const userOpHash: string = await entryPoint.getUserOpHash(tuple);



  return { userOp, userOpHash };

}


