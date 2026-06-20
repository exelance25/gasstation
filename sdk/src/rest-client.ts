import type { GasDeliveryAsset } from "./types.js";

export type GasStationRestConfig = {
  baseUrl: string;
  /** Varsayılan: 60s dispense, 15s diğer */
  timeoutMs?: number;
};

export type OracleQuoteResponse = {
  packageUsd: number;
  deliveryAsset: GasDeliveryAsset;
  estimatedGasAmount: number;
  netUsdForGas: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  ethPrice: number;
  monPrice: number;
};

export type GasPrecheckResponse = {
  ok: boolean;
  reason?: string;
  estimatedGasAmount?: number;
};

export type GasIntentResponse = {
  intentId: string;
  orderId: string;
  expiresAt: string;
};

export type GasDispenseResponse = {
  ok: true;
  depositTxHash: string;
  deliveryTxHash: string;
  estimatedGasAmount: number;
  message: string;
};

/**
 * REST-only entegrasyon — cüzdan/DEX/dApp backend.
 * Public endpoint'ler; production'da rate limit uygulanır.
 */
export class GasStationRestClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: GasStationRestConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  async getOracleQuote(params: {
    packageUsd?: number;
    deliveryAmount?: number;
    asset: GasDeliveryAsset;
  }): Promise<OracleQuoteResponse> {
    const q = new URLSearchParams({ asset: params.asset });
    if (params.deliveryAmount != null && params.deliveryAmount > 0) {
      q.set("amount", String(params.deliveryAmount));
    } else if (params.packageUsd != null) {
      q.set("package", String(params.packageUsd));
    } else {
      throw new Error("packageUsd veya deliveryAmount gerekli");
    }
    return this.get(`/api/oracle/quote?${q}`);
  }

  async precheckGas(body: {
    packageAmount: number;
    targetAsset: GasDeliveryAsset;
    targetAddress: string;
  }): Promise<GasPrecheckResponse> {
    return this.post("/api/gas/precheck", body);
  }

  async createIntent(body: {
    passId: string;
    targetAsset: GasDeliveryAsset;
    targetAddress: string;
    packageAmount: number;
    depositChain: string;
  }): Promise<GasIntentResponse> {
    return this.post("/api/gas/intent", body);
  }

  async dispenseGas(body: {
    txHash: string;
    targetAsset: GasDeliveryAsset;
    targetAddress: string;
    packageAmount: number;
    orderId?: string;
    intentId?: string;
    depositorAddress?: string;
  }): Promise<GasDispenseResponse> {
    return this.post("/api/gas/dispense", body, 120_000);
  }

  async getHealth(): Promise<{ ok: boolean }> {
    return this.get("/api/health");
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}${path}`, { cache: "no-store" });
    return this.parseJson(res);
  }

  private async post<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      timeoutMs,
    );
    return this.parseJson(res);
  }

  private fetchWithTimeout(url: string, init: RequestInit, timeoutMs?: number): Promise<Response> {
    const ms = timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  private async parseJson<T>(res: Response): Promise<T> {
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : `API error (${res.status})`,
      );
    }
    return data;
  }
}
