import { isAddress, parseUnits, type Address, type Hash, type PublicClient } from "viem";
import type { DepotAssetId } from "@/config/depot-assets";
import { getPaymentAsset } from "@/config/pool-tokens";
import { erc20Abi } from "@/lib/erc20-abi";
import { pumpPaymasterAbi } from "@/lib/contracts/pump-paymaster-abi";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";
import {
  calculateManuelGasOut,
} from "@/lib/oracle/calculate-manuel-gas-out";
import { manuelTargetForAsset } from "@/lib/auto-fee/path-resolver";
import type { AmountOption } from "@/lib/pricing";

export type ExecutePaymasterUsdcParams = {
  deliveryAsset: DepotAssetId;
  beneficiaryAddress: string;
  packageUsd: AmountOption;
  payerAddress: Address;
  publicClient: PublicClient;
  writeContract: (args: {
    address: Address;
    abi: typeof erc20Abi | typeof pumpPaymasterAbi;
    functionName: string;
    args: readonly unknown[];
    chainId?: number;
  }) => Promise<Hash>;
  chainId: number;
  switchChain: (chainId: number) => Promise<void>;
  walletChainId?: number;
  onStatus?: (title: string, message: string) => void;
};

export type PaymasterUsdcResult = {
  deliveryTxHash: string;
  usdcPaid: string;
  gasDeliveredWei: string;
};

export async function executePaymasterUsdc(
  params: ExecutePaymasterUsdcParams,
): Promise<PaymasterUsdcResult> {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster) throw new Error("PumpPaymaster yapılandırılmamış");

  const beneficiary = params.beneficiaryAddress.trim();
  if (!isAddress(beneficiary)) throw new Error("Geçersiz hedef adresi");

  const manuelTarget = manuelTargetForAsset(params.deliveryAsset);
  if (!manuelTarget) {
    throw new Error("Bu gas türü paymaster yoluyla desteklenmiyor (SOL için native yol)");
  }

  const token = getPaymentAsset("USDC");
  if (!token.enabled || !token.contractAddress) {
    throw new Error("USDC token adresi yapılandırılmamış");
  }

  if (params.walletChainId !== params.chainId) {
    await params.switchChain(params.chainId);
  }

  const quote = await calculateManuelGasOut(params.packageUsd, manuelTarget);
  if (quote.contractGasWei <= 0n) {
    throw new Error("Geçersiz gas teklifi");
  }

  const amountPaidWei = parseUnits(String(params.packageUsd), token.decimals);

  params.onStatus?.(
    "İşlem bekleniyor",
    `$${params.packageUsd} USDC → PumpPaymaster (buyGasManuel)`,
  );

  const allowance = await params.publicClient.readContract({
    address: token.contractAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [params.payerAddress, paymaster],
  });

  if (allowance < amountPaidWei) {
    const approveHash = await params.writeContract({
      address: token.contractAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [paymaster, amountPaidWei],
      chainId: params.chainId,
    });
    await params.publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const buyHash = await params.writeContract({
    address: paymaster,
    abi: pumpPaymasterAbi,
    functionName: "buyGasManuel",
    args: [
      token.contractAddress,
      amountPaidWei,
      quote.contractGasWei,
      beneficiary as Address,
    ],
    chainId: params.chainId,
  });

  const receipt = await params.publicClient.waitForTransactionReceipt({ hash: buyHash });
  if (receipt.status !== "success") {
    throw new Error("buyGasManuel blokzincirde başarısız");
  }

  return {
    deliveryTxHash: buyHash,
    usdcPaid: String(params.packageUsd),
    gasDeliveredWei: quote.contractGasWei.toString(),
  };
}
