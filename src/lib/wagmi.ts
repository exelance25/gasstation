/** @deprecated Use @config/wagmi-config — geriye uyumluluk */
export { wagmiConfig } from "@config/wagmi-config";
export {
  isWalletConnectReady,
  paymentChain as sourceChain,
  PAYMENT_CHAIN_ID,
  PAYMENT_CHAIN_NAME,
  monadTestnet,
  monadMainnet,
  getPaymentRpcUrl as getSourceRpcUrl,
  getUsdcAddress,
  erc20Abi,
} from "@config/evm-chains";
