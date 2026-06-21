import type { Address, Hash, Hex, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { parseUnits } from "viem";
import { GasStationFee, type FeeQuote, type SupportedChain } from "./client.js";
import type { PaymentToken } from "./types.js";

export type GasStationAutoSponsorConfig = {
  apiUrl: string;
  /** Paymaster kontrat (USDC yolu) */
  paymasterAddress?: Address;
  /** USDC token adresi — paymaster yolu için */
  usdcAddress?: Address;
  chainId: number;
  rpcUrl: string;
  chain?: Chain;
};

const CHAIN_ID_TO_NAME: Record<number, SupportedChain> = {
  1: "ethereum",
  11155111: "ethereum-sepolia",
  8453: "base",
  84532: "base-sepolia",
  10143: "monad-testnet",
  143: "monad",
};

const CHAIN_ID_TO_TOKEN: Record<number, PaymentToken> = {
  1: "ETH",
  11155111: "ETH",
  8453: "BASE",
  84532: "BASE",
  10143: "MON",
  143: "MON",
};

/**
 * dApp entegrasyonu — kullanıcı gas düşünmeden kontrat çağrısı.
 * Akış: quote (gas tank + kar marjı) → USDC onay → paymaster / settlement → kontrat tx.
 */
export class GasStationAutoSponsor {
  private readonly fee: GasStationFee;
  private readonly config: GasStationAutoSponsorConfig;

  constructor(config: GasStationAutoSponsorConfig) {
    this.config = config;
    this.fee = new GasStationFee({ apiUrl: config.apiUrl, settlementUrl: config.apiUrl });
  }

  chainName(): SupportedChain {
    return CHAIN_ID_TO_NAME[this.config.chainId] ?? "ethereum-sepolia";
  }

  paymentToken(): PaymentToken {
    return CHAIN_ID_TO_TOKEN[this.config.chainId] ?? "ETH";
  }

  /** Gas + protokol kar marjı dahil ücret teklifi */
  async quoteSponsorship(params: {
    userAddress: string;
    gasEstimateWei?: bigint;
  }): Promise<FeeQuote> {
    const gasEstimateWei = params.gasEstimateWei ?? 21_000n * 50_000_000_000n;
    return this.fee.getQuote({
      chain: this.chainName(),
      paymentToken: this.paymentToken(),
      gasEstimateWei: gasEstimateWei.toString(),
      userAddress: params.userAddress,
    });
  }

  /**
   * Kontrat çağrısını gas sponsorlu yürüt.
   * Kullanıcı yalnızca approve + kontrat onayını verir; gas tanktan karşılanır.
   */
  async executeSponsoredContractCall(params: {
    userAddress: Address;
    walletClient: WalletClient<Transport, Chain, Account>;
    publicClient: PublicClient;
    targetContract: Address;
    callData: Hex;
    gasEstimateWei?: bigint;
    onStatus?: (title: string, detail: string) => void;
  }): Promise<{ txHash: Hash; quote: FeeQuote }> {
    const quote = await this.quoteSponsorship({
      userAddress: params.userAddress,
      gasEstimateWei: params.gasEstimateWei,
    });

    params.onStatus?.(
      "Gas sponsorlu işlem",
      `${quote.paymentAmountFormatted.toFixed(6)} ${quote.paymentToken} + tank gas`,
    );

    if (this.config.paymasterAddress && this.config.usdcAddress) {
      const amountPaidWei = parseUnits(
        quote.paymentAmountFormatted.toFixed(6),
        6,
      );

      const erc20Abi = [
        {
          type: "function",
          name: "approve",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ type: "bool" }],
        },
      ] as const;

      const allowance = await params.publicClient.readContract({
        address: this.config.usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [params.userAddress, this.config.paymasterAddress],
      });

      if (allowance < amountPaidWei) {
        params.onStatus?.("USDC onayı", "Paymaster için allowance verin");
        const approveHash = await params.walletClient.writeContract({
          account: params.walletClient.account!,
          chain: this.config.chain ?? params.walletClient.chain,
          address: this.config.usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [this.config.paymasterAddress, amountPaidWei],
        });
        await params.publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      params.onStatus?.("Kontrat onayı", "İşleminizi onaylayın");
      const txHash = await params.walletClient.sendTransaction({
        account: params.walletClient.account!,
        chain: this.config.chain ?? params.walletClient.chain,
        to: params.targetContract,
        data: params.callData,
      });

      return { txHash, quote };
    }

    params.onStatus?.("Native ödeme", "Gas tank settlement yolu");
    const paymentAmount = BigInt(quote.paymentAmount);
    const treasuryRes = await fetch(`${this.config.apiUrl.replace(/\/$/, "")}/treasury/collector`);
    const treasuryBody = (await treasuryRes.json()) as { address?: string };
    if (!treasuryBody.address) {
      throw new Error("Treasury adresi alınamadı");
    }

    const payHash = await params.walletClient.sendTransaction({
      account: params.walletClient.account!,
      chain: this.config.chain ?? params.walletClient.chain,
      to: treasuryBody.address as Address,
      value: paymentAmount,
    });
    await params.publicClient.waitForTransactionReceipt({ hash: payHash });

    const settleRes = await fetch(`${this.config.apiUrl.replace(/\/$/, "")}/v1/settle/fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quote.quoteId,
        chain: quote.chain,
        paymentToken: quote.paymentToken,
        gasEstimateWei: quote.gasEstimateWei,
        paymentAmount: quote.paymentAmount,
        expiresAt: quote.expiresAt,
        signature: quote.signature,
        paymentTxHash: payHash,
        payerAddress: params.userAddress,
        beneficiaryAddress: params.userAddress,
      }),
    });
    const settleBody = (await settleRes.json()) as { deliveryTxHash?: string; error?: string };
    if (!settleRes.ok) {
      throw new Error(settleBody.error ?? `Settlement failed (${settleRes.status})`);
    }

    const txHash = await params.walletClient.sendTransaction({
      account: params.walletClient.account!,
      chain: this.config.chain ?? params.walletClient.chain,
      to: params.targetContract,
      data: params.callData,
    });

    return { txHash, quote };
  }
}
