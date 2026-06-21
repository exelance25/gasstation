import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import { apiErrorMessage, parseResponseJson } from "@/lib/api/parse-response-json";

export type DispenseGasRequest = {
  txHash: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositorAddress?: string;
  intentId?: string;
  orderId?: string;
  paymentMode?: "usdc" | "native";
};

export type DispenseGasResponse = {
  ok: true;
  depositTxHash: string;
  deliveryTxHash: string;
  deliveryChainId?: number;
  targetAsset: DepotAssetId;
  estimatedGasAmount: number;
  message: string;
};

export type DispenseGasError = {
  error: string;
};

export async function postDispenseGas(
  payload: DispenseGasRequest,
): Promise<DispenseGasResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  let res: Response;
  try {
    res = await fetch("/api/gas/dispense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = await parseResponseJson<DispenseGasResponse | DispenseGasError>(res);

  if (!data) {
    throw new Error(apiErrorMessage(res, null, "Gas teslimat API hatası"));
  }

  if (!res.ok) {
    throw new Error(apiErrorMessage(res, data, "Gas teslimat API hatası"));
  }

  return data as DispenseGasResponse;
}
