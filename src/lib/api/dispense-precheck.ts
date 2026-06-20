import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";

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
  const data = (await res.json()) as DispensePrecheckResponse & { error?: string };
  if (!res.ok) {
    return {
      ok: false,
      reason: data.reason ?? data.error ?? "Kasadan çıkış kontrolü başarısız",
    };
  }
  return data;
}
