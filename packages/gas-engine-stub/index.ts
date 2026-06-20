/**
 * @pumpstation/gas-engine — gas sponsorship canlı API + route stub
 */

export type PumpStationConfig = {
  apiUrl?: string;
  settlementUrl?: string;
  quoteUrl?: string;
  apiKey?: string;
  environment?: "development" | "staging" | "production";
};

export type TransferCurrency = "USDC" | "ETH" | "SOL";

export type RouteLeg = {
  sourceChain: string;
  sourceWallet: string;
  amount: string;
  symbol: string;
};

export type OptimalRoute = {
  routeId: string;
  targetChain: string;
  targetAddress: string;
  amount: string;
  currency: TransferCurrency;
  legs: RouteLeg[];
  estimatedGasUsd: number;
  summaryLines: string[];
};

export type AggregatedBalanceResult = {
  totalUsd: number;
  currency: "USD";
  breakdown: Array<{ chainId: string; symbol: string; amountUsd: number }>;
  updatedAt: string;
};

export type ExecuteRouteResult = {
  transactionId: string;
  status: "pending" | "completed";
};

export type GasEligibilityResult = {
  chainId: number;
  userAddress: string;
  nativeBalanceWei: string;
  estimatedGasWei: string;
  needsSponsorship: boolean;
};

export type GasSponsorshipRequest = {
  userAddress: string;
  chainId: number;
  intentId: string;
  estimatedGasUsd?: number;
  gasEstimateWei?: string;
  paymentToken?: "ETH" | "MON" | "BASE" | "SOL";
};

export type GasSponsorshipResult = {
  sponsorshipId: string;
  status: "sponsored" | "quote_ready" | "pending";
  relayerAddress: string;
  message: string;
  quote?: unknown;
  treasuryAddress?: string | null;
};

export type GasSettlementResult = {
  sponsorshipId: string;
  status: "settled" | "failed";
  reclaimedFeeUsd: number;
  reclaimedFeeWei: string;
  deliveryTxHash?: string | null;
};

export class PumpStationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INSUFFICIENT_BALANCE"
      | "REJECTED"
      | "NETWORK"
      | "GAS_SPONSOR_FAILED"
      | "UNKNOWN"
  ) {
    super(message);
    this.name = "PumpStationError";
  }
}

function settlementBase(config: PumpStationConfig): string {
  return (
    config.settlementUrl ??
    config.apiUrl?.replace(/\/api$/, "")?.replace(":3000", ":4200") ??
    "http://localhost:4200"
  );
}

function authHeaders(config: PumpStationConfig): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) {
    h.Authorization = `Bearer ${config.apiKey}`;
    h["x-settlement-api-key"] = config.apiKey;
  }
  return h;
}

export class PumpStationClient {
  constructor(private readonly config: PumpStationConfig = {}) {}

  async getAggregatedBalance(addresses: string[]): Promise<AggregatedBalanceResult> {
    if (!addresses.length) {
      return { totalUsd: 0, currency: "USD", breakdown: [], updatedAt: new Date().toISOString() };
    }
    const seed = addresses.join("").length;
    const totalUsd = 70.67 + (seed % 10) * 0.01;
    return {
      totalUsd,
      currency: "USD",
      breakdown: [
        { chainId: "ethereum", symbol: "ETH", amountUsd: totalUsd * 0.45 },
        { chainId: "solana", symbol: "SOL", amountUsd: totalUsd * 0.42 },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  async getOptimalRoute(
    fromAddresses: string[],
    toAddress: string,
    amount: number,
    currency: TransferCurrency,
  ): Promise<OptimalRoute> {
    if (!fromAddresses.length) {
      throw new PumpStationError("Bağlı cüzdan bulunamadı", "INSUFFICIENT_BALANCE");
    }
    if (amount <= 0) {
      throw new PumpStationError("Geçersiz tutar", "INSUFFICIENT_BALANCE");
    }
    const targetChain =
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(toAddress) ? "Solana" : "Ethereum";
    return {
      routeId: `route_${Date.now()}`,
      targetChain,
      targetAddress: toAddress,
      amount: String(amount),
      currency,
      legs: [],
      estimatedGasUsd: 0.5,
      summaryLines: [`${amount} ${currency} → ${toAddress}`],
    };
  }

  async executeRoute(route: OptimalRoute): Promise<ExecuteRouteResult> {
    if (Number(route.amount) > 10_000) {
      throw new PumpStationError("İşlem reddedildi", "REJECTED");
    }
    return { transactionId: `tx_${route.routeId}`, status: "completed" };
  }

  /** Canlı — native bakiye vs tahmini gas */
  async checkGasEligibility(
    userAddress: string,
    chainId: number,
    nativeBalanceWei: bigint,
    gasEstimateWei = 21_000n * 50_000_000n,
  ): Promise<GasEligibilityResult> {
    return {
      chainId,
      userAddress,
      nativeBalanceWei: nativeBalanceWei.toString(),
      estimatedGasWei: gasEstimateWei.toString(),
      needsSponsorship: nativeBalanceWei < gasEstimateWei,
    };
  }

  /** Canlı — settlement engine üzerinden imzalı quote */
  async requestGasSponsorship(
    request: GasSponsorshipRequest,
  ): Promise<GasSponsorshipResult> {
    const base = settlementBase(this.config);
    try {
      const res = await fetch(`${base}/v1/sponsor/prepare`, {
        method: "POST",
        headers: authHeaders(this.config),
        body: JSON.stringify({
          userAddress: request.userAddress,
          chainId: request.chainId,
          intentId: request.intentId,
          gasEstimateWei: request.gasEstimateWei,
          paymentToken: request.paymentToken ?? "ETH",
        }),
      });
      const body = (await res.json()) as GasSponsorshipResult & { error?: string };
      if (!res.ok) {
        throw new PumpStationError(body.error ?? "Sponsor başarısız", "GAS_SPONSOR_FAILED");
      }
      return {
        sponsorshipId: body.sponsorshipId,
        status: body.status ?? "quote_ready",
        relayerAddress: "PUMPSTATION",
        message: body.message,
        quote: body.quote,
        treasuryAddress: body.treasuryAddress,
      };
    } catch (err) {
      if (err instanceof PumpStationError) throw err;
      throw new PumpStationError("Settlement API erişilemedi", "NETWORK");
    }
  }

  /** Settlement tamamlandıktan sonra kayıt */
  async settleGasSponsorship(
    sponsorshipId: string,
    deliveryTxHash?: string,
  ): Promise<GasSettlementResult> {
    return {
      sponsorshipId,
      status: "settled",
      reclaimedFeeUsd: 0,
      reclaimedFeeWei: "0",
      deliveryTxHash: deliveryTxHash ?? null,
    };
  }

  /** Tam otomatik fee akışı — ödeme tx + quote → gas teslim */
  async settleAutoFee(params: {
    quote: Record<string, unknown>;
    paymentTxHash: string;
    payerAddress: string;
    beneficiaryAddress: string;
  }): Promise<{
    settlementId: string;
    deliveryTxHash: string | null;
    status: string;
  }> {
    const base = settlementBase(this.config);
    const q = params.quote as {
      quoteId: string;
      chain: string;
      paymentToken: string;
      gasEstimateWei: string;
      paymentAmount: string;
      expiresAt: string;
      signature: string;
    };
    const res = await fetch(`${base}/v1/settle/fee`, {
      method: "POST",
      headers: authHeaders(this.config),
      body: JSON.stringify({
        ...q,
        paymentTxHash: params.paymentTxHash,
        payerAddress: params.payerAddress,
        beneficiaryAddress: params.beneficiaryAddress,
      }),
    });
    const body = (await res.json()) as {
      settlementId?: string;
      deliveryTxHash?: string | null;
      status?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new PumpStationError(body.error ?? "Settlement başarısız", "GAS_SPONSOR_FAILED");
    }
    return {
      settlementId: body.settlementId!,
      deliveryTxHash: body.deliveryTxHash ?? null,
      status: body.status ?? "GAS_DELIVERED",
    };
  }
}
