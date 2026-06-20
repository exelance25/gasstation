import type {
  FeeQuote,
  GetFeeQuoteParams,
  GasStationFeeConfig,
  SettleFeeParams,
  SettleFeeResult,
  SupportedChain,
  PaymentToken,
} from "./types";

const DEFAULT_GAS_WEI = 21_000n * 50_000_000_000n;

export class GasStationFee {
  private readonly apiUrl: string;
  private readonly settlementUrl: string;
  private readonly apiKey?: string;

  constructor(config: GasStationFeeConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.settlementUrl =
      config.settlementUrl?.replace(/\/$/, "") ?? "http://localhost:4200";
    this.apiKey = config.apiKey;
  }

  async getQuote(params: GetFeeQuoteParams): Promise<FeeQuote> {
    const gasEstimateWei =
      typeof params.gasEstimateWei === "bigint"
        ? params.gasEstimateWei.toString()
        : params.gasEstimateWei;

    const res = await fetch(`${this.apiUrl}/v1/quote/fee`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        chain: params.chain,
        paymentToken: params.paymentToken,
        gasEstimateWei,
        userAddress: params.userAddress,
      }),
    });

    const body = (await res.json()) as FeeQuote & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Quote failed (${res.status})`);
    return body;
  }

  estimateGasWei(units = 21_000n, maxFeePerGasWei = 50_000_000_000n): bigint {
    return units * maxFeePerGasWei;
  }

  async quoteDefaultFee(
    chain: SupportedChain,
    paymentToken: PaymentToken,
    userAddress?: string,
  ): Promise<FeeQuote> {
    return this.getQuote({
      chain,
      paymentToken,
      gasEstimateWei: DEFAULT_GAS_WEI,
      userAddress,
    });
  }

  async verifyQuote(quote: FeeQuote): Promise<boolean> {
    if (!quote.signature) return false;
    const res = await fetch(`${this.apiUrl}/v1/quote/verify`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        quoteId: quote.quoteId,
        chain: quote.chain,
        paymentToken: quote.paymentToken,
        gasEstimateWei: quote.gasEstimateWei,
        paymentAmount: quote.paymentAmount,
        expiresAt: quote.expiresAt,
        signature: quote.signature,
      }),
    });
    const body = (await res.json()) as { valid?: boolean };
    return Boolean(body.valid);
  }

  /**
   * Wallet/DEX entegrasyonu — ödeme tx gönderildikten sonra gas teslimi
   * 1. getQuote → kullanıcıya paymentAmount göster
   * 2. Kullanıcı treasury'ye native token gönderir
   * 3. settleFee → gas beneficiary'ye teslim
   */
  async settleFee(params: SettleFeeParams): Promise<SettleFeeResult> {
    const q = params.quote;
    if (!q.signature) throw new Error("İmzasız quote settle edilemez");

    const res = await fetch(`${this.settlementUrl}/v1/settle/fee`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        quoteId: q.quoteId,
        chain: q.chain,
        paymentToken: q.paymentToken,
        gasEstimateWei: q.gasEstimateWei,
        paymentAmount: q.paymentAmount,
        expiresAt: q.expiresAt,
        signature: q.signature,
        paymentTxHash: params.paymentTxHash,
        payerAddress: params.payerAddress,
        beneficiaryAddress: params.beneficiaryAddress,
      }),
    });

    const body = (await res.json()) as SettleFeeResult & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Settlement failed (${res.status})`);
    return body;
  }

  /** Tek çağrıda sponsor hazırlığı — gas engine uyumlu */
  async prepareSponsorship(params: {
    userAddress: string;
    chainId: number;
    intentId: string;
    paymentToken?: PaymentToken;
    gasEstimateWei?: string;
  }): Promise<{
    sponsorshipId: string;
    quote: FeeQuote;
    treasuryAddress: string | null;
    message: string;
  }> {
    const res = await fetch(`${this.settlementUrl}/v1/sponsor/prepare`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params),
    });
    const body = (await res.json()) as {
      sponsorshipId: string;
      quote: FeeQuote;
      treasuryAddress: string | null;
      message: string;
      error?: string;
    };
    if (!res.ok) throw new Error(body.error ?? "Sponsor prepare failed");
    return body;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      h.Authorization = `Bearer ${this.apiKey}`;
      h["x-settlement-api-key"] = this.apiKey;
    }
    return h;
  }
}

export type {
  FeeQuote,
  GetFeeQuoteParams,
  GasStationFeeConfig,
  SettleFeeParams,
  SettleFeeResult,
  SupportedChain,
  PaymentToken,
};
