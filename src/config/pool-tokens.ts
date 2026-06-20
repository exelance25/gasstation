import { isAddress, type Address } from "viem";
import { clientEnv } from "@/config/client-env";
import { NATIVE_FEE_TOKEN } from "@/lib/contracts/pump-paymaster-abi";
import { paymentChain } from "@config/evm-chains";

/** Circle USDC — resmi adresler (depozit yalnızca USDC) */
export const MONAD_TESTNET_USDC =
  "0x534b2f3A21130d7a60830c2Df862319e593943A3" as const satisfies Address;
export const MONAD_MAINNET_USDC =
  "0x754704Bc059F8C67012fEd69BC8A327a5aafb603" as const satisfies Address;

function optionalAddress(value: string | undefined): Address | null {
  if (!value?.trim() || !isAddress(value.trim())) return null;
  return value.trim() as Address;
}

export function getDefaultUsdcAddress(): Address | null {
  const configured = optionalAddress(clientEnv.NEXT_PUBLIC_MONAD_USDC_ADDRESS);
  if (configured) return configured;
  return paymentChain.id === 143 ? MONAD_MAINNET_USDC : MONAD_TESTNET_USDC;
}

export function getDefaultFeeToken(): Address {
  const usdc = getDefaultUsdcAddress();
  if (usdc) return usdc;
  const legacy = optionalAddress(clientEnv.NEXT_PUBLIC_BASE_USDC_ADDRESS);
  if (legacy) return legacy;
  return NATIVE_FEE_TOKEN;
}

export function isFeeTokenConfigured(): boolean {
  return getDefaultFeeToken() !== NATIVE_FEE_TOKEN;
}

export const USDC_DECIMALS = 6;

export type PaymentAssetId = "USDC";
export type PaymentTokenId = PaymentAssetId;

export function getPaymentAsset(id: PaymentAssetId) {
  const addr = getDefaultUsdcAddress();
  return {
    id: "USDC" as const,
    label: "USDC",
    symbol: "USDC",
    type: "erc20" as const,
    decimals: USDC_DECIMALS,
    contractAddress: addr,
    enabled: Boolean(addr),
    hint: addr ? undefined : "NEXT_PUBLIC_MONAD_USDC_ADDRESS gerekli",
  };
}

export type PaymentToken = ReturnType<typeof getPaymentAsset>;

/** Gas havuzu dashboard — yalnızca USDC */
export function getPaymentTokens(): PaymentToken[] {
  return [getPaymentAsset("USDC")];
}
