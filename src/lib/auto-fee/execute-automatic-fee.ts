import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { Hash, PublicClient } from "viem";
import { PumpStationFee, type FeeQuote, type SettleFeeResult } from "@pumpstation/fee-sdk";
import type { DepotAssetId } from "@/config/depot-assets";
import { clientEnv, isAutoFeeEnabled } from "@/config/client-env";
import { getSolanaRpcUrl } from "@/config/solana-usdc";
import type { DepositNetworkRow } from "@/hooks/useDepositUsdcBalance";
import {
  DEFAULT_GAS_ESTIMATE_WEI,
  deliveryChainForAsset,
  paymentTokenForDeposit,
} from "./chain-map";
import { getNativeTreasuryAddress } from "./treasury-native";

const API_BASE = clientEnv.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");

function createFeeClient(): PumpStationFee {
  return new PumpStationFee({
    apiUrl: API_BASE,
    settlementUrl: API_BASE,
  });
}

export type ExecuteAutomaticFeeParams = {
  deposit: DepositNetworkRow;
  deliveryAsset: DepotAssetId;
  beneficiaryAddress: string;
  payerAddress: string;
  quote?: FeeQuote | null;
  evm?: {
    sendTransaction: (args: {
      to: `0x${string}`;
      value: bigint;
      chainId: number;
    }) => Promise<Hash>;
    publicClient: PublicClient;
    switchChain: (chainId: number) => Promise<void>;
    walletChainId?: number;
  };
  solana?: {
    publicKey: PublicKey;
    sendTransaction: (
      tx: Transaction,
      connection: Connection,
    ) => Promise<string>;
  };
  onStatus?: (title: string, message: string) => void;
};

export async function fetchAutomaticFeeQuote(params: {
  deposit: DepositNetworkRow;
  deliveryAsset: DepotAssetId;
  userAddress?: string;
}): Promise<FeeQuote> {
  const client = createFeeClient();
  return client.getQuote({
    chain: deliveryChainForAsset(params.deliveryAsset),
    paymentToken: paymentTokenForDeposit(params.deposit),
    gasEstimateWei: DEFAULT_GAS_ESTIMATE_WEI,
    userAddress: params.userAddress,
  });
}

export async function executeAutomaticFee(
  params: ExecuteAutomaticFeeParams,
): Promise<SettleFeeResult> {
  const treasury = getNativeTreasuryAddress(params.deposit);
  if (!treasury) {
    throw new Error("GASSTATION native kasası yapılandırılmamış");
  }

  const quote =
    params.quote ??
    (await fetchAutomaticFeeQuote({
      deposit: params.deposit,
      deliveryAsset: params.deliveryAsset,
      userAddress: params.payerAddress,
    }));

  if (!quote.signature) {
    const devUnsignedOk =
      isAutoFeeEnabled() &&
      (clientEnv.NEXT_PUBLIC_APP_ENV === "testnet" ||
        clientEnv.NEXT_PUBLIC_APP_ENV === "development");
    if (!devUnsignedOk) {
      throw new Error("Quote imzası eksik — quote engine yapılandırmasını kontrol edin");
    }
  }

  const paymentAmount = BigInt(quote.paymentAmount);
  let paymentTxHash: string;

  params.onStatus?.(
    "İşlem bekleniyor",
    `${quote.paymentAmountFormatted.toFixed(6)} ${quote.paymentToken} — cüzdan onayını verin.`,
  );

  if (params.deposit.kind === "solana") {
    if (!params.solana) throw new Error("Solana cüzdanı bağlı değil");
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const treasuryPk = new PublicKey(treasury);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: params.solana.publicKey,
        toPubkey: treasuryPk,
        lamports: Number(paymentAmount),
      }),
    );
    paymentTxHash = await params.solana.sendTransaction(tx, connection);
    await connection.confirmTransaction(paymentTxHash, "confirmed");
  } else {
    if (!params.evm) throw new Error("EVM cüzdanı bağlı değil");
    if (params.evm.walletChainId !== params.deposit.chainId) {
      await params.evm.switchChain(params.deposit.chainId);
    }
    const hash = await params.evm.sendTransaction({
      to: treasury as `0x${string}`,
      value: paymentAmount,
      chainId: params.deposit.chainId,
    });
    const receipt = await params.evm.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("Native ödeme blokzincirde başarısız oldu");
    }
    paymentTxHash = hash;
  }

  params.onStatus?.("Ödeme onaylandı", "Gas teslimatı başlatılıyor…");

  const settleBody = {
    quoteId: quote.quoteId,
    chain: quote.chain,
    paymentToken: quote.paymentToken,
    gasEstimateWei: quote.gasEstimateWei,
    paymentAmount: quote.paymentAmount,
    expiresAt: quote.expiresAt,
    signature: quote.signature,
    paymentTxHash,
    payerAddress: params.payerAddress,
    beneficiaryAddress: params.beneficiaryAddress,
  };

  const res = await fetch(`${API_BASE}/v1/settle/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settleBody),
  });
  const body = (await res.json()) as SettleFeeResult & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Settlement failed (${res.status})`);
  return body;
}

export function formatNativePaymentDisplay(quote: FeeQuote): string {
  if (quote.paymentToken === "SOL") {
    const sol = Number(BigInt(quote.paymentAmount)) / LAMPORTS_PER_SOL;
    return `~${sol.toFixed(6)} SOL`;
  }
  return `~${quote.paymentAmountFormatted.toFixed(6)} ${quote.paymentToken}`;
}
