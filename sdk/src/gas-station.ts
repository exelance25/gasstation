import type { Address, Hex, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { GasStationRestClient } from "./rest-client.js";
import type { GasDeliveryAsset } from "./types.js";

export type QuotePaymentToken = "USDC" | "MON" | "BASE" | "ETH" | "DAI";

export type GasQuote = {
  quoteId: string;
  gasNeeded: string;
  cost: string;
  fee: string;
  costUsd: number;
  feeUsd: number;
  deliveryAmount: number;
  paymentToken: QuotePaymentToken;
  deliveryAsset: GasDeliveryAsset;
  liquidity: { ok: boolean; reason?: string };
  expiresAt: string;
};

export type GasStationConfig = {
  apiUrl: string;
};

export type GasStationPayParams = {
  deliveryAsset: GasDeliveryAsset;
  paymentToken?: QuotePaymentToken;
  gasEstimateWei?: bigint | string;
  targetAddress: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient<Transport, Chain, Account>;
  depositChainId?: number;
  passId?: string;
  depositChain?: string;
};

export type GasStationPayResult = {
  quote: GasQuote;
  gasEstimateWei: string;
  precheck: { ok: boolean; reason?: string; estimatedGasAmount?: number };
};

/**
 * Layer 1 — SDK entry point.
 * Network check · balance check · gas estimate · quote · liquidity-aware precheck.
 */
export class GasStation {
  private readonly apiUrl: string;
  private readonly rest: GasStationRestClient;

  constructor(config: GasStationConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.rest = new GasStationRestClient({ baseUrl: this.apiUrl });
  }

  /** Layer 1 — verify wallet is on the expected chain */
  async checkNetwork(publicClient: PublicClient, expectedChainId: number): Promise<number> {
    const chainId = await publicClient.getChainId();
    if (chainId !== expectedChainId) {
      throw new Error(`Wrong network: expected chain ${expectedChainId}, got ${chainId}`);
    }
    return chainId;
  }

  /** Layer 1 — native balance must cover minimum payment */
  async checkBalance(
    publicClient: PublicClient,
    address: Address,
    minWei: bigint,
  ): Promise<bigint> {
    const balance = await publicClient.getBalance({ address });
    if (balance < minWei) {
      throw new Error(`Insufficient balance: need ${minWei} wei, have ${balance} wei`);
    }
    return balance;
  }

  /** Layer 1 — estimate gas for a simple transfer or contract call */
  async estimateGas(
    publicClient: PublicClient,
    params: { account?: Address; to: Address; value?: bigint; data?: Hex },
  ): Promise<bigint> {
    return publicClient.estimateGas({
      account: params.account,
      to: params.to,
      value: params.value ?? 0n,
      data: params.data,
    });
  }

  /** Layer 2 — Quoter: USDC / MON / BASE / DAI / ETH → delivery gas */
  async quote(params: {
    deliveryAsset: GasDeliveryAsset;
    paymentToken: QuotePaymentToken;
    gasEstimateWei: string | bigint;
    depositChainId?: number;
  }): Promise<GasQuote> {
    const gasEstimateWei =
      typeof params.gasEstimateWei === "bigint"
        ? params.gasEstimateWei.toString()
        : params.gasEstimateWei;

    return this.rest.quoteGas({
      deliveryAsset: params.deliveryAsset,
      paymentToken: params.paymentToken,
      gasEstimateWei,
      depositChainId: params.depositChainId,
    });
  }

  /**
   * Layer 1 orchestration — gasStation.pay()
   * Checks network & balance, estimates gas, fetches quote, runs liquidity precheck.
   */
  async pay(params: GasStationPayParams): Promise<GasStationPayResult> {
    const chainId = params.depositChainId ?? (await params.publicClient.getChainId());
    await this.checkNetwork(params.publicClient, chainId);

    const gasWei =
      params.gasEstimateWei != null
        ? typeof params.gasEstimateWei === "bigint"
          ? params.gasEstimateWei
          : BigInt(params.gasEstimateWei)
        : await this.estimateGas(params.publicClient, {
            account: params.walletClient?.account?.address,
            to: params.targetAddress,
            value: 0n,
          });

    const paymentToken = params.paymentToken ?? "ETH";
    const quote = await this.quote({
      deliveryAsset: params.deliveryAsset,
      paymentToken,
      gasEstimateWei: gasWei,
      depositChainId: chainId,
    });

    if (!quote.liquidity.ok) {
      throw new Error(quote.liquidity.reason ?? "Insufficient treasury liquidity");
    }

    const precheck = await this.rest.precheckGas({
      packageAmount: quote.costUsd,
      targetAsset: params.deliveryAsset,
      targetAddress: params.targetAddress,
    });

    if (!precheck.ok) {
      throw new Error(precheck.reason ?? "Gas precheck failed");
    }

    return {
      quote,
      gasEstimateWei: gasWei.toString(),
      precheck,
    };
  }
}
