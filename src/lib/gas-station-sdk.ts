import {
  createPublicClient,
  encodeAbiParameters,
  http,
  parseGwei,
  isAddress,
  toHex,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { baseSepolia } from "viem/chains";
import type { SubmitUserOpResponse, UserOperation } from "@/types/user-operation";

export interface PumpConfig {
  paymasterAddress: Address;
  entryPointAddress: Address;
  rpcUrl: string;
  relayerSubmitUrl?: string;
}

const entryPointNonceAbi = [
  {
    type: "function",
    name: "getNonce",
    stateMutability: "view",
    inputs: [
      { name: "sender", type: "address" },
      { name: "key", type: "uint192" },
    ],
    outputs: [{ name: "nonce", type: "uint256" }],
  },
] as const;

/**
 * GasStation SDK — manuel oluşturulan ERC-4337 UserOperation helper'ı.
 */
export class GasStationSDK {
  private readonly client: PublicClient;
  private readonly config: PumpConfig;

  constructor(config: PumpConfig) {
    this.config = config;
    this.client = createPublicClient({
      chain: baseSepolia,
      transport: http(config.rpcUrl),
    }) as PublicClient;
  }

  /**
   * OTOMATIK MOD:
   * Kullanıcı için paymaster destekli UserOperation taslağı hazırlar.
   * Not: Burada imza ve bundler submit yok; sadece op oluşturulur.
   */
  async createGaslessOp(
    userAddress: Address,
    targetAddress: Address,
    callData: Hex,
    tokenToPay: Address,
  ): Promise<UserOperation> {
    if (!isAddress(targetAddress)) {
      throw new Error("Invalid target contract address");
    }
    const nonce = await this.getNonce(userAddress);
    const maxFeePerGas = await this.getGasPrice();

    // ERC-4337 v0.6: paymasterAndData = paymasterAddress ++ abi.encode(user, feeToken)
    const paymasterContext = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }],
      [userAddress, tokenToPay],
    );
    const paymasterAndData =
      `${this.config.paymasterAddress}${paymasterContext.slice(2)}` as Hex;

    const userOp: UserOperation = {
      sender: userAddress,
      nonce: toHex(nonce),
      initCode: "0x",
      callData,
      callGasLimit: toHex(200_000n),
      verificationGasLimit: toHex(100_000n),
      preVerificationGas: toHex(50_000n),
      maxFeePerGas: toHex(maxFeePerGas),
      maxPriorityFeePerGas: toHex(parseGwei("1")),
      paymasterAndData,
      signature: "0x",
    };

    return userOp;
  }

  /**
   * Cüzdan imzası için deterministik metin.
   * Not: Üretimde mümkünse EIP-712 typed data imzası tercih edin.
   */
  serializeUserOp(userOp: UserOperation): string {
    return JSON.stringify(
      {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: userOp.callGasLimit,
        verificationGasLimit: userOp.verificationGasLimit,
        preVerificationGas: userOp.preVerificationGas,
        maxFeePerGas: userOp.maxFeePerGas,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        paymasterAndData: userOp.paymasterAndData,
      },
      null,
      0,
    );
  }

  attachSignature(userOp: UserOperation, signature: Hex): UserOperation {
    return { ...userOp, signature };
  }

  async sendToRelayer(userOp: UserOperation): Promise<SubmitUserOpResponse> {
    const endpoint = this.config.relayerSubmitUrl ?? "/api/relay/submit";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOp }),
    });
    const body = (await res.json()) as SubmitUserOpResponse & { error?: string };
    if (!res.ok) {
      throw new Error(body.error ?? `Relayer error (${res.status})`);
    }
    return body;
  }

  private async getNonce(address: Address): Promise<bigint> {
    return this.client.readContract({
      address: this.config.entryPointAddress,
      abi: entryPointNonceAbi,
      functionName: "getNonce",
      args: [address, 0n],
    });
  }

  private async getGasPrice(): Promise<bigint> {
    return this.client.getGasPrice();
  }
}
