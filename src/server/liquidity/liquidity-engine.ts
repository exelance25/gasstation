import "server-only";

import type { GasDeliveryAsset } from "@/config/depot-assets";
import { canDispenseEvmNativeGas } from "@/server/gas/dispense-evm-gas";
import { canDispenseEvmUsdc } from "@/server/gas/dispense-evm-usdc";
import { canDispenseSolanaGas } from "@/server/gas/dispense-solana-gas";
import { getOperatorTankStatus } from "@/server/gas/operator-tank-status";
import { isOperatorConfigured, isSolanaOperatorConfigured } from "@/config/operator-env";

export type LiquidityAssessment = {
  ok: boolean;
  reason?: string;
  deliveryAsset: GasDeliveryAsset;
  deliveryAmount: number;
  operatorConfigured: boolean;
  tanksReady: boolean;
};

/**
 * Layer 3 — Liquidity Engine
 * Verifies operator tanks can fulfill delivery before quoting/settling.
 */
export async function assessDeliveryLiquidity(params: {
  deliveryAsset: GasDeliveryAsset;
  deliveryAmount: number;
  depositChainId?: number;
}): Promise<LiquidityAssessment> {
  const { deliveryAsset, deliveryAmount, depositChainId } = params;

  if (!Number.isFinite(deliveryAmount) || deliveryAmount <= 0) {
    return {
      ok: false,
      reason: "Invalid delivery amount",
      deliveryAsset,
      deliveryAmount: 0,
      operatorConfigured: false,
      tanksReady: false,
    };
  }

  if (deliveryAsset === "SOL") {
    if (!isSolanaOperatorConfigured()) {
      return {
        ok: false,
        reason: "Solana operator not configured",
        deliveryAsset,
        deliveryAmount,
        operatorConfigured: false,
        tanksReady: false,
      };
    }
    const check = await canDispenseSolanaGas(deliveryAmount);
    return {
      ok: check.ok,
      reason: check.ok ? undefined : check.reason,
      deliveryAsset,
      deliveryAmount,
      operatorConfigured: true,
      tanksReady: check.ok,
    };
  }

  if (!isOperatorConfigured()) {
    return {
      ok: false,
      reason: "EVM operator not configured",
      deliveryAsset,
      deliveryAmount,
      operatorConfigured: false,
      tanksReady: false,
    };
  }

  if (deliveryAsset === "USDC") {
    const chainId = depositChainId ?? 84532;
    const check = await canDispenseEvmUsdc(chainId, deliveryAmount);
    return {
      ok: check.ok,
      reason: check.ok ? undefined : check.reason,
      deliveryAsset,
      deliveryAmount,
      operatorConfigured: true,
      tanksReady: check.ok,
    };
  }

  const nativeCheck = await canDispenseEvmNativeGas(deliveryAsset, deliveryAmount);
  const tankStatus = await getOperatorTankStatus();
  const tank = tankStatus.tanks.find((t) => t.asset === deliveryAsset && t.kind === "native");
  const tankBal = tank ? Number.parseFloat(tank.balanceNative) : 0;

  return {
    ok: nativeCheck.ok,
    reason: nativeCheck.ok
      ? undefined
      : nativeCheck.reason ?? `Insufficient ${deliveryAsset} in operator tank (${tankBal})`,
    deliveryAsset,
    deliveryAmount,
    operatorConfigured: true,
    tanksReady: nativeCheck.ok,
  };
}
