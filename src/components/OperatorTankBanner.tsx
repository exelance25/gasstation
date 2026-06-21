"use client";

import type { DepotAssetId } from "@/config/depot-assets";
import {
  findTankForAsset,
  isTankLikelyEmpty,
  useOperatorTanks,
} from "@/hooks/useOperatorTanks";

type OperatorTankBannerProps = {
  deliveryAsset: DepotAssetId;
};

/**
 * Operatör gas tankı — kasadaki USDC/MON ile karıştırılmamalı.
 * ETH teslimat = Sepolia ETH; MON teslimat = Monad MON (aynı cüzdan, farklı ağ).
 */
export function OperatorTankBanner({ deliveryAsset }: OperatorTankBannerProps) {
  const { data, isLoading } = useOperatorTanks();
  if (isLoading || !data?.tanks.length) return null;

  const tank = findTankForAsset(data.tanks, deliveryAsset);
  const empty = isTankLikelyEmpty(tank);
  const addr = data.operatorAddress;

  return (
    <div
      className={
        empty
          ? "rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 text-xs text-amber-100"
          : "rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5 text-xs text-emerald-100"
      }
    >
      <p className="font-semibold">
        Gas tankı ({deliveryAsset}) — {tank?.chainName ?? "—"}
      </p>
      {tank ? (
        <p className="mt-1 text-[11px] opacity-90">
          Operatörde: <strong>{Number(tank.balanceNative).toFixed(6)}</strong> {tank.symbol}
          {empty ? (
            <>
              {" "}
              — teslimat için yetersiz.{" "}
              {deliveryAsset === "ETH" ? (
                <>
                  Kasadaki <strong>MON</strong> başka ağdadır; ETH almak için operatör cüzdanına{" "}
                  <strong>Sepolia ETH</strong> gönderin
                  {addr ? (
                    <>
                      {" "}
                      (
                      <span className="font-mono">{addr.slice(0, 8)}…{addr.slice(-6)}</span>)
                    </>
                  ) : null}
                  . Öneri: en az <strong>0.02 Sepolia ETH</strong>.
                </>
              ) : deliveryAsset === "MON" ? (
                <> Faucet ile operatöre MON gönderin.</>
              ) : (
                <> Operatör cüzdanını ilgili testnet native ile doldurun.</>
              )}
            </>
          ) : (
            " — teslimat hazır."
          )}
        </p>
      ) : (
        <p className="mt-1 text-[11px] opacity-80">Tank bilgisi yok.</p>
      )}
      <p className="mt-1.5 text-[10px] opacity-70">
        USDC ödemeniz kasaya girer; gas çıkışı operatörün o ağdaki native bakiyesinden yapılır.
      </p>
    </div>
  );
}
