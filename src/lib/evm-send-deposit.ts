"use client";

import type { Connector } from "wagmi";
import { type Address, type Hash, type Hex } from "viem";
import { getChainById } from "@/lib/evm-chain-client";

type RequestProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

async function ensureProviderChain(
  provider: RequestProvider,
  chainId: number,
): Promise<void> {
  const chain = getChainById(chainId);
  const chainIdHex = `0x${chainId.toString(16)}` as Hex;

  try {
    await provider.request!({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await provider.request!({
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
      await provider.request!({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } else if (code === 4001) {
      throw new Error("Network switch cancelled in wallet.");
    } else {
      throw switchError;
    }
  }
}

async function getWalletProvider(
  connector: Connector | undefined,
): Promise<RequestProvider> {
  if (!connector) {
    throw new Error("Wallet connector missing — reconnect with MetaMask or Rabby.");
  }
  const provider = (await connector.getProvider?.()) as RequestProvider | undefined;
  if (!provider?.request) {
    throw new Error("Wallet provider not ready — reopen your wallet extension.");
  }
  return provider;
}

/** MetaMask / Rabby — direct provider transfer (avoids wagmi sync issues) */
export async function sendNativeDepositViaProvider(params: {
  connector: Connector | undefined;
  from: Address;
  to: Address;
  valueWei: bigint;
  chainId: number;
}): Promise<Hash> {
  const provider = await getWalletProvider(params.connector);
  await ensureProviderChain(provider, params.chainId);

  const valueHex = `0x${params.valueWei.toString(16)}` as Hex;
  const hash = await provider.request!({
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
    throw new Error("Wallet returned an invalid transaction hash.");
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
  const provider = await getWalletProvider(params.connector);
  await ensureProviderChain(provider, params.chainId);

  const transferData =
    `0xa9059cbb${params.to.slice(2).padStart(64, "0")}${params.amount.toString(16).padStart(64, "0")}` as Hex;

  const hash = await provider.request!({
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
    throw new Error("USDC transfer could not be sent from wallet.");
  }

  return hash as Hash;
}
