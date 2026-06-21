import type { DepotAssetId } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import { apiErrorMessage, parseResponseJson } from "@/lib/api/parse-response-json";

export async function postRetryDispense(
  txHash: string,
  recovery?: {
    orderId?: string;
    targetAsset?: DepotAssetId;
    targetAddress?: string;
    packageAmount?: AmountOption;
    depositorAddress?: string;
  },
) {
  const res = await fetch("/api/gas/retry-dispense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash, ...recovery }),
  });
  const data = await parseResponseJson<{ error?: string } & Record<string, unknown>>(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(res, data, "Kasa retry başarısız"));
  }
  if (!data) {
    throw new Error("Kasa retry — boş yanıt");
  }
  return data;
}
