import {
  createPublicClient,
  encodeAbiParameters,
  http,
  isAddress,
  maxUint256,
  parseGwei,
  toHex,
  type Account,
  type Address,
  type Chain,
  type Hash,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import { baseSepolia } from "viem/chains";
import { getTestnetDefaults, type PumpTestnetConfig } from "./testnet.js";

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

export interface PumpClientConfig {
  paymasterAddress: Address;
  entryPointAddress: Address;
  usdcAddress: Address;
  rpcUrl: string;
  relayerSubmitUrl?: string;
  chain?: Chain;
}

export interface PrepareGaslessParams {
  userAddress: Address;
  targetAddress: Address;
  callData: Hex;
  tokenToPay?: Address;
  requiredAllowanceWei: bigint;
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

const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export class PumpClient {
  private readonly config: PumpClientConfig;
  private readonly publicClient: PublicClient<Transport, Chain>;

  constructor(config: PumpClientConfig) {
    this.config = config;
    this.publicClient = createPublicClient({
      chain: config.chain ?? baseSepolia,
      transport: http(config.rpcUrl),
    }) as PublicClient<Transport, Chain>;
  }

  /** Testnet varsayılanlarından PumpClient oluştur */
  static fromTestnet(paymasterAddress: Address, overrides?: Partial<PumpTestnetConfig>) {
    const defaults = getTestnetDefaults(paymasterAddress);
    const merged = { ...defaults, ...overrides, paymasterAddress };
    return new PumpClient({
      paymasterAddress,
      entryPointAddress: merged.entryPointAddress,
      usdcAddress: merged.usdcAddress,
      rpcUrl: merged.rpcUrl,
      relayerSubmitUrl: merged.relayerSubmitUrl,
      chain: merged.sourceChain,
    });
  }

  async createGaslessOp(
    userAddress: Address,
    targetAddress: Address,
    callData: Hex,
    tokenToPay: Address = this.config.usdcAddress,
  ): Promise<UserOperation> {
    if (!isAddress(targetAddress)) {
      throw new Error("Invalid target address");
    }

    const nonce = await this.publicClient.readContract({
      address: this.config.entryPointAddress,
      abi: entryPointNonceAbi,
      functionName: "getNonce",
      args: [userAddress, 0n],
    });
    const maxFeePerGas = await this.publicClient.getGasPrice();

    const context = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }],
      [userAddress, tokenToPay],
    );
    const paymasterAndData = `${this.config.paymasterAddress}${context.slice(2)}` as Hex;

    return {
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
  }

  async getAllowance(owner: Address, token: Address = this.config.usdcAddress): Promise<bigint> {
    return this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, this.config.paymasterAddress],
    });
  }

  async ensureAllowance(
    walletClient: WalletClient<Transport, Chain, Account>,
    owner: Address,
    requiredAllowanceWei: bigint,
    token: Address = this.config.usdcAddress,
  ): Promise<{ approvedNow: boolean; approveTxHash?: Hash }> {
    const current = await this.getAllowance(owner, token);
    if (current >= requiredAllowanceWei) {
      return { approvedNow: false };
    }

    const approveTxHash = await walletClient.writeContract({
      account: walletClient.account!,
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [this.config.paymasterAddress, maxUint256],
      chain: this.config.chain ?? baseSepolia,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: approveTxHash });
    return { approvedNow: true, approveTxHash };
  }

  async prepareGaslessWithAllowance(
    walletClient: WalletClient<Transport, Chain, Account>,
    params: PrepareGaslessParams,
  ): Promise<{ userOp: UserOperation; approvedNow: boolean; approveTxHash?: Hash }> {
    const approval = await this.ensureAllowance(
      walletClient,
      params.userAddress,
      params.requiredAllowanceWei,
      params.tokenToPay ?? this.config.usdcAddress,
    );

    const userOp = await this.createGaslessOp(
      params.userAddress,
      params.targetAddress,
      params.callData,
      params.tokenToPay ?? this.config.usdcAddress,
    );

    return {
      userOp,
      approvedNow: approval.approvedNow,
      approveTxHash: approval.approveTxHash,
    };
  }

  serializeUserOp(userOp: UserOperation): string {
    return JSON.stringify({
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
    });
  }

  attachSignature(userOp: UserOperation, signature: Hex): UserOperation {
    return { ...userOp, signature };
  }

  async sendToRelayer(userOp: UserOperation): Promise<{ transactionHash: string; beneficiary: string }> {
    const endpoint = this.config.relayerSubmitUrl ?? "/api/relay/submit";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOp }),
    });

    const body = (await res.json()) as
      | { transactionHash: string; beneficiary: string }
      | { error?: string };

    if (!res.ok || "error" in body) {
      throw new Error(("error" in body && body.error) || `Relayer error (${res.status})`);
    }
    return body;
  }
}
