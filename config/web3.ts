"use client";



import { connectorsForWallets } from "@rainbow-me/rainbowkit";

import {

  base,

  braveWallet,

  coinbaseWallet,

  ledgerWallet,

  metaMaskWallet,

  okxWallet,

  rabbyWallet,

  rainbowWallet,

  trustWallet,

  walletConnectWallet,

  zerionWallet,

} from "@rainbow-me/rainbowkit/wallets";

import { http, createConfig, createStorage, type Config } from "wagmi";

import { base as baseChain, baseSepolia, mainnet, sepolia } from "viem/chains";

import { clientEnv } from "@/config/client-env";

import { wrapWalletFactory } from "@/lib/wrap-wallet-force-approval";

import { phantomEvmWallet } from "@/wallets/phantom-evm-wallet";

import {

  getPaymentRpcUrl,

  isWalletConnectReady,

  arcTestnet,

  monadMainnet,

  monadTestnet,

  paymentChain,

  supportedEvmChains,

} from "@config/evm-chains";



export {

  arcTestnet,

  monadMainnet,

  monadTestnet,

  paymentChain,

  PAYMENT_CHAIN_ID,

  PAYMENT_CHAIN_NAME,

  USDC_BY_CHAIN,

  DEPOSIT_EVM_CHAIN_IDS,

  USDC_DECIMALS,

  supportedEvmChains,

  isUsdcDepositChain,

  getUsdcAddress,

  getChainDisplayName,

  getPaymentRpcUrl,

  isWalletConnectReady,

  erc20Abi,

} from "@config/evm-chains";



const wcProjectId = clientEnv.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";

const rkProjectId = isWalletConnectReady ? wcProjectId : "00000000000000000000000000000000";

export const walletAppName = "GasStation";



export const walletConnectParameters = {

  metadata: {

    name: walletAppName,

    description: "EVM gas pump — USDC depozit",

    url: typeof window !== "undefined" ? window.location.origin : "https://gasstation.local",

    icons: [`${typeof window !== "undefined" ? window.location.origin : ""}/wallets/metamask.svg`] as string[],

  },

  options: {

    forceConnect: true,

  },

};



const rkParams = {

  projectId: rkProjectId,

  walletConnectParameters,

};



/** Yerel geliştirme: enjekte cüzdanlar (WalletConnect API gerektirmez) */

const localDevWallets = [

  wrapWalletFactory(() => metaMaskWallet(rkParams)),

  wrapWalletFactory(rabbyWallet),

  phantomEvmWallet,

  wrapWalletFactory(() => coinbaseWallet({ appName: walletAppName })),

  wrapWalletFactory(braveWallet),

];



/** Üretim / WC_ENABLED: tam liste */

const fullWalletsRecommended = [

  wrapWalletFactory(() => metaMaskWallet(rkParams)),

  wrapWalletFactory(rabbyWallet),

  phantomEvmWallet,

  wrapWalletFactory(() => trustWallet(rkParams)),

  wrapWalletFactory(() => okxWallet(rkParams)),

  wrapWalletFactory(() => coinbaseWallet({ appName: walletAppName })),

  wrapWalletFactory(() => base({ appName: walletAppName })),

];



const fullWalletsMore = [

  wrapWalletFactory(() => rainbowWallet(rkParams)),

  wrapWalletFactory(() => zerionWallet(rkParams)),

  wrapWalletFactory(braveWallet),

  wrapWalletFactory(() => ledgerWallet(rkParams)),

  wrapWalletFactory(() => walletConnectWallet(rkParams)),

];



const recommendedWallets = isWalletConnectReady ? fullWalletsRecommended : localDevWallets;

const moreWallets = isWalletConnectReady ? fullWalletsMore : [];



const rainbowConnectors = connectorsForWallets(

  [

    { groupName: "Recommended", wallets: recommendedWallets },

    ...(moreWallets.length ? [{ groupName: "More wallets", wallets: moreWallets }] : []),

  ],

  {

    appName: walletAppName,

    projectId: rkProjectId,

    walletConnectParameters,

  },

);



export const wagmiConfig: Config = createConfig({

  chains: [...supportedEvmChains],

  connectors: rainbowConnectors,

  multiInjectedProviderDiscovery: false,

  storage: createStorage({

    storage:

      typeof window !== "undefined"

        ? sessionStorage

        : ({

            get length() {

              return 0;

            },

            clear: () => {},

            getItem: () => null,

            key: () => null,

            setItem: () => {},

            removeItem: () => {},

          } satisfies Storage),

  }),

  transports: {

    [paymentChain.id]: http(getPaymentRpcUrl()),

    [monadTestnet.id]: http(clientEnv.NEXT_PUBLIC_MONAD_TESTNET_RPC),

    [monadMainnet.id]: http(clientEnv.NEXT_PUBLIC_MONAD_MAINNET_RPC ?? "https://rpc.monad.xyz"),

    [baseChain.id]: http(clientEnv.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org"),

    [baseSepolia.id]: http(clientEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org"),

    [mainnet.id]: http(clientEnv.NEXT_PUBLIC_ETH_MAINNET_RPC),

    [sepolia.id]: http(clientEnv.NEXT_PUBLIC_ETH_SEPOLIA_RPC),

    [arcTestnet.id]: http(

      clientEnv.NEXT_PUBLIC_ARC_TESTNET_RPC ?? "https://rpc.testnet.arc.network",

    ),

  },

  ssr: true,

});


