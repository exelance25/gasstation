"use client";

import type { Connector } from "wagmi";
import { type Address, type Hash, type Hex } from "viem";
import { getChainById } from "@/lib/evm-chain-client";

type RequestProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/** MetaMask / Rabby — doğrudan provider üzerinden transfer (wagmi senkron sorunlarını aşar) */
export async function sendNativeDepositViaProvider(params: {
  connector: Connector | undefined;
  from: Address;
  to: Address;
  valueWei: bigint;
  chainId: number;
}): Promise<Hash> {
  if (!params.connector) {
    throw new Error("Cüzdan connector bulunamadı — MetaMask ile yeniden bağlanın.");
  }

  const provider = (await params.connector.getProvider?.()) as RequestProvider | undefined;
  if (!provider?.request) {
    throw new Error("Cüzdan provider hazır değil — MetaMask'ı yeniden açın.");
  }

  const chain = getChainById(params.chainId);
  const chainIdHex = `0x${params.chainId.toString(16)}` as Hex;
  const valueHex = `0x${params.valueWei.toString(16)}` as Hex;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls.default.http,
            blockExplorerUrls: chain.blockExplorers?.default?.url
              ? [chain.blockExplorers.default.url]
              : undefined,
          },
        ],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } else if (code !== 4001) {
      throw switchError;
    } else {
      throw new Error("Ağ değişimi cüzdanda iptal edildi.");
    }
  }

  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: params.from,
        to: params.to,
        value: valueHex,
      },
    ],
  });

  if (typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("Cüzdan geçersiz işlem yanıtı döndü.");
  }

  return hash as Hash;
}

export async function sendErc20TransferViaProvider(params: {
  connector: Connector | undefined;
  from: Address;
  token: Address;
  to: Address;
  amount: bigint;
  chainId: number;
}): Promise<Hash> {
  if (!params.connector) {
    throw new Error("Cüzdan connector bulunamadı — MetaMask ile yeniden bağlanın.");
  }

  const provider = (await params.connector.getProvider?.()) as RequestProvider | undefined;
  if (!provider?.request) {
    throw new Error("Cüzdan provider hazır değil.");
  }

  const chainIdHex = `0x${params.chainId.toString(16)}` as Hex;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    /* ağ zaten doğru olabilir */
  }

  const transferData =
    `0xa9059cbb${params.to.slice(2).padStart(64, "0")}${params.amount.toString(16).padStart(64, "0")}` as Hex;

  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: params.from,
        to: params.token,
        data: transferData,
      },
    ],
  });

  if (typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("USDC transferi cüzdandan gönderilemedi.");
  }

  return hash as Hash;
}
