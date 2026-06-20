import { parseEther, type Chain } from "viem";
import { monadMainnet, monadTestnet } from "@config/evm-chains";

/** Monad MIP: her EOA en az bu kadar MON tutmalı (normal transferlerde). */
export const MONAD_USER_RESERVE_WEI = parseEther("10");

export function isMonadChain(chain: Chain): boolean {
  return chain.id === monadTestnet.id || chain.id === monadMainnet.id;
}

/**
 * Operatör bakiyesi reserve altındaysa yalnızca "emptying" tx ile tek seferlik gönderim mümkün.
 * Üretim kasası için en az reserve + teslimat + gas gerekir.
 */
export function getMonadMinOperatorBalanceWei(deliveryValueWei: bigint): bigint {
  return MONAD_USER_RESERVE_WEI + deliveryValueWei;
}

export function formatMonadReserveHint(balanceWei: bigint, deliveryValueWei: bigint): string {
  const min = getMonadMinOperatorBalanceWei(deliveryValueWei);
  const minMon = Number(min) / 1e18;
  const balMon = Number(balanceWei) / 1e18;
  return (
    `Monad reserve kuralı: operatörde en az ~${minMon.toFixed(2)} MON gerekli ` +
    `(10 MON reserve + teslimat). Mevcut: ~${balMon.toFixed(4)} MON. ` +
    `Faucet: https://faucet.monad.xyz`
  );
}
