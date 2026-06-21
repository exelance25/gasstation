import type { Address, Hash, Hex, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { parseUnits } from "viem";
import { GasStationFee, type FeeQuote } from "./client";
import type { PaymentToken, SupportedChain } from "./types";

export type GasStationAutoSponsorConfig = {
  apiUrl: string;
  paymasterAddress?: Address;
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

/** dApp — gas tank + kar marjı ile sponsorlu kontrat çağrısı */
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
      `${quote.paymentAmountFormatted.toFixed(6)} ${quote.paymentToken}`,
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

      const txHash = await params.walletClient.sendTransaction({
        account: params.walletClient.account!,
        chain: this.config.chain ?? params.walletClient.chain,
        to: params.targetContract,
        data: params.callData,
      });
      return { txHash, quote };
    }

    throw new Error(
      "Paymaster yapılandırılmamış — paymasterAddress ve usdcAddress gerekli",
    );
  }
}
