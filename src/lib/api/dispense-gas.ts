import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";

export type DispenseGasRequest = {
  txHash: string;
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositorAddress?: string;
  intentId?: string;
  orderId?: string;
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

  const data = (await res.json()) as DispenseGasResponse | DispenseGasError;

  if (!res.ok) {
    const message =
      "error" in data && data.error
        ? data.error
        : `Gas teslimat API hatası (${res.status})`;
    throw new Error(message);
  }

  return data as DispenseGasResponse;
}
