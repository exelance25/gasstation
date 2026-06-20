import "server-only";

import { ethers } from "ethers";
import type { UserOperation } from "@/types/user-operation";
import { entryPointAbi } from "@/server/relayer/entry-point-abi";
import { assertUserOpShape, userOpToTuple } from "@/server/relayer/user-op-utils";
import { getRelayerConfig, isRelayerConfigured } from "@/config/relayer-env";

export class PumpRelayer {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly entryPointAddress: string;

  constructor(rpcUrl: string, privateKey: string, entryPointAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.entryPointAddress = entryPointAddress;
  }

  get beneficiary(): string {
    return this.wallet.address;
  }

  private entryPoint(readOnly = true) {
    return new ethers.Contract(
      this.entryPointAddress,
      entryPointAbi,
      readOnly ? this.provider : this.wallet,
    );
  }

  /** EntryPoint.getUserOpHash — imza öncesi hash */
  async getUserOpHash(userOp: UserOperation): Promise<string> {
    assertUserOpShape(userOp);
    const hash: string = await this.entryPoint(true).getUserOpHash(
      userOpToTuple(userOp),
    );
    return hash;
  }

  /** Zincir üzerinde doğrulama simülasyonu */
  async simulateUserOperation(userOp: UserOperation): Promise<void> {
    assertUserOpShape(userOp);
    if (!userOp.signature || userOp.signature === "0x") {
      throw new Error("UserOperation signature required for simulation");
    }
    await this.entryPoint(true).simulateValidation.staticCall(userOpToTuple(userOp));
  }

  /**
   * Kullanıcının imzaladığı UserOperation'ı EntryPoint.handleOps ile ağa basar.
   */
  async sendUserOperation(userOp: UserOperation): Promise<string> {
    assertUserOpShape(userOp);
    if (!userOp.signature || userOp.signature === "0x") {
      throw new Error("UserOperation signature missing");
    }

    await this.simulateUserOperation(userOp);

    try {
      const tx = await this.entryPoint(false).handleOps(
        [userOpToTuple(userOp)],
        this.wallet.address,
      );
      const receipt = await tx.wait();
      if (!receipt?.hash) {
        throw new Error("Missing transaction receipt");
      }
      return receipt.hash;
    } catch (error) {
      console.error("UserOp gönderimi başarısız:", error);
      throw new Error(
        "Transaction simulation failed - Secure rollback trigger.",
      );
    }
  }
}

let relayerSingleton: PumpRelayer | null = null;

export function getPumpRelayer(): PumpRelayer {
  if (!isRelayerConfigured()) {
    throw new Error("Relayer is not configured on the server");
  }
  if (!relayerSingleton) {
    const cfg = getRelayerConfig();
    relayerSingleton = new PumpRelayer(
      cfg.rpcUrl,
      cfg.privateKey,
      cfg.entryPointAddress,
    );
  }
  return relayerSingleton;
}
