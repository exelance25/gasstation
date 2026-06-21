import type { DepotAssetId } from "@/config/depot-assets";
import type { PaySymbol } from "@/config/payment-assets";
import type { AmountOption } from "@/lib/pricing";
import { apiErrorMessage, parseResponseJson } from "@/lib/api/parse-response-json";

export async function postDepositIntent(payload: {
  targetAsset: DepotAssetId;
  targetAddress: string;
  packageAmount: AmountOption;
  depositChainId: number;
  depositorAddress: string;
  passId?: string;
  paySymbol?: PaySymbol;
  paymentMode?: "usdc" | "native";
}): Promise<{ intentId: string; orderId: string; passId: string }> {
  const res = await fetch("/api/gas/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponseJson<{
    intentId?: string;
    orderId?: string;
    passId?: string;
    error?: string;
  }>(res);
  if (!res.ok || !data?.orderId) {
    throw new Error(
      apiErrorMessage(res, data, "Sipariş kaydı oluşturulamadı"),
    );
  }
  return {
    intentId: data.orderId,
    orderId: data.orderId,
    passId: data.passId ?? "",
  };
}

export async function postRetryDispense(txHash: string) {
  const res = await fetch("/api/gas/retry-dispense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash }),
  });
  const data = await parseResponseJson<{ error?: string }>(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(res, data, "Kasa retry başarısız"));
  }
  if (!data) {
    throw new Error("Kasa retry — boş yanıt");
  }
  return data;
}
