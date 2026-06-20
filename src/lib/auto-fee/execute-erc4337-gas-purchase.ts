import { isAddress, parseUnits, type Address, type Hex } from "viem";
import type { WalletClient } from "viem";
import type { DepotAssetId } from "@/config/depot-assets";
import { getPaymentAsset } from "@/config/pool-tokens";
import { getDefaultFeeToken } from "@/config/pool-tokens";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";
import { buildBuyGasManuelUserOpCallData } from "@/lib/pump-call-data";
import { calculateManuelGasOut } from "@/lib/oracle/calculate-manuel-gas-out";
import { manuelTargetForAsset } from "@/lib/auto-fee/path-resolver";
import {
  attachSignature,
  prepareUserOp,
  submitUserOp,
} from "@/lib/relay-client";
import type { AmountOption } from "@/lib/pricing";

export type ExecuteErc4337GasPurchaseParams = {
  smartAccountAddress: Address;
  deliveryAsset: DepotAssetId;
  beneficiaryAddress: string;
  packageUsd: AmountOption;
  walletClient: WalletClient;
  intentId: string;
  onStatus?: (title: string, message: string) => void;
};

export async function executeErc4337GasPurchase(
  params: ExecuteErc4337GasPurchaseParams,
): Promise<{ transactionHash: string; gasDeliveredWei: string }> {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster) throw new Error("PumpPaymaster yapılandırılmamış");

  const beneficiary = params.beneficiaryAddress.trim();
  if (!isAddress(beneficiary)) throw new Error("Geçersiz hedef adresi");

  const manuelTarget = manuelTargetForAsset(params.deliveryAsset);
  if (!manuelTarget) throw new Error("SOL paymaster yoluyla desteklenmiyor");

  const token = getPaymentAsset("USDC");
  if (!token.contractAddress) throw new Error("USDC yapılandırılmamış");

  const quote = await calculateManuelGasOut(params.packageUsd, manuelTarget);
  const amountPaidWei = parseUnits(String(params.packageUsd), token.decimals);

  const callData = buildBuyGasManuelUserOpCallData({
    paymaster,
    tokenPaid: token.contractAddress,
    amountPaidWei,
    expectedGasWei: quote.contractGasWei,
    recipient: beneficiary as Address,
  });

  params.onStatus?.(
    "Gasless işlem",
    "ERC-4337 UserOp hazırlanıyor — cüzdan imzası istenecek",
  );

  const feeToken = getDefaultFeeToken();
  const { userOp, userOpHash } = await prepareUserOp({
    sender: params.smartAccountAddress,
    callData,
    usePaymaster: true,
    feeToken,
  });

  const signature = await params.walletClient.signMessage({
    account: params.smartAccountAddress,
    message: { raw: userOpHash as Hex },
  });

  const signed = attachSignature(userOp, signature);
  const result = await submitUserOp({
    userOp: signed,
    intentId: params.intentId,
  });

  return {
    transactionHash: result.transactionHash,
    gasDeliveredWei: quote.contractGasWei.toString(),
  };
}
