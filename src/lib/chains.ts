/** @deprecated Use config/web3.ts */
export {
  paymentChain as sourceChain,
  PAYMENT_CHAIN_NAME as SOURCE_CHAIN_NAME,
  PAYMENT_CHAIN_ID as SUPPORTED_SOURCE_CHAIN_ID,
  PAYMENT_CHAIN_ID as SUPPORTED_TARGET_CHAIN_ID,
  monadTestnet,
  monadMainnet,
  getPaymentRpcUrl as getSourceRpcUrl,
  supportedEvmChains,
  isUsdcDepositChain,
  getUsdcAddress,
  getChainDisplayName,
  DEPOSIT_EVM_CHAIN_IDS,
} from "../../config/web3";
