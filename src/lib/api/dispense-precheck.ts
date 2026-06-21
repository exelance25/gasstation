import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import { apiErrorMessage, parseResponseJson } from "@/lib/api/parse-response-json";

export type DispensePrecheckResponse = {
  ok: boolean;
  reason?: string;
  estimatedGasAmount?: number;
  targetAsset?: DepotAssetId;
  packageAmount?: AmountOption;
};

export async function postDispensePrecheck(payload: {
  targetAsset: DepotAssetId;
  packageAmount: AmountOption;
  targetAddress: string;
}): Promise<DispensePrecheckResponse> {
  const res = await fetch("/api/gas/precheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponseJson<
    DispensePrecheckResponse & { error?: string }
  >(res);
  if (!data) {
    return {
      ok: false,
      reason: apiErrorMessage(res, null, "Kasadan çıkış kontrolü başarısız"),
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      reason: apiErrorMessage(res, data, "Kasadan çıkış kontrolü başarısız"),
    };
  }
  return data;
}
