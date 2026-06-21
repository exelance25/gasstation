/** User-facing copy — universal English */

export const messages = {
  appName: "GASSTATION",
  tagline: "Pay with USDC, ETH, BASE, or MON — receive ETH, BASE, or MON gas",
  supportedPayAssets: "ETH · BASE · MON · USDC",
  walletConsent:
    "I allow read-only balance access for payments. My address is not stored on the server.",

  fire: "FIRE",
  firing: "PROCESSING…",
  locked: "LOCKED…",

  welcome: {
    readyTitle: "You're set — station is open",
    readyDetail: "Payment · amount · destination · FIRE",
    connectTitle: "Connect your wallet",
    connectDetail: "Pay with USDC, ETH, BASE, or MON and receive gas in seconds.",
  },

  wallet: {
    connectTitle: "Connect wallet",
    connectCta: "Connect wallet →",
    connectedLabel: "Payment wallet connected",
    useDifferent: "Use a different wallet",
    disconnect: "Disconnect",
    close: "Close",
    pickWallet: "Choose a wallet",
    noWallets: "No wallet found. Install MetaMask, Rabby, or Phantom.",
    waitingApproval: "Waiting for approval…",
    connectFailed: "Wallet connection was rejected or failed.",
    phantomFootnote: "Phantom: EVM approval, then Solana · addresses are not stored on our server",
    phantomSub: "EVM approval → Solana approval",
  },

  depositHint: "Connect → pick balance → enter amount → FIRE.",

  pump: {
    fueling: "Fueling",
    preparingOrder: "Preparing order…",
    checkingOrder: "Checking order…",
    switchingNetwork: "Confirm the network switch in your wallet.",
    switchNetworkFailed: "Could not switch network — add the payment network in your wallet.",
    paymentSourceMissing: "Select a payment source.",
    invalidAmount: "Enter a valid payment amount.",
    walletAddressMissing: "Wallet address not found.",
    evmNotConnected: "EVM wallet not fully connected — refresh and reconnect.",
    orderSaved: "Order saved — confirm payment in your wallet.",
    confirmNative: "Confirm the payment in your wallet.",
    confirmUsdc: "Confirm the USDC payment in your wallet.",
    paymentSent: "Payment sent — waiting for confirmation…",
    delivering: "Sending gas from treasury…",
    successTitle: "Gas delivered",
    successRetryTitle: "Delivery completed",
    successAlreadyTitle: "Gas was already delivered",
    failedTitle: "Transaction failed",
    deliveryUnavailable: "Delivery is temporarily unavailable. Please try again shortly.",
    depositConfirmedDeliveryFailed:
      "Your payment was confirmed ({tx}) but gas delivery failed: {reason}. Save the transaction hash and contact support if needed.",

    amountTitle: "Amount required",
    amountMsg: "Enter the gas amount you want to buy.",
    walletTitle: "Wallet required",
    walletMsg: "Connect an EVM or Solana wallet.",
    depositTitle: "Payment source",
    depositMsg: "Pick a payment source (USDC, ETH, BASE, or MON).",
    balanceTitle: "Insufficient balance",
    balanceMsg: "Not enough balance on the selected payment source.",
    targetTitle: "Target address",
    targetMsg: "Enter a valid address to receive gas.",
    usdcLowMsg: "Not enough USDC on this network — try another token or a smaller amount.",
    collectorTitle: "Service unavailable",
    collectorMsg: "GasStation is not ready yet — please try again later.",
    autoOffTitle: "Automatic mode off",
    autoOffMsg: "Use manual mode or enable automatic fees in settings.",
    treasuryNativeTitle: "Treasury not configured",
    treasuryNativeMsg: "Native treasury addresses are missing in server config.",
    quoteTitle: "Calculating fee",
    quoteMsg: "Fetching automatic fee quote…",
    paymasterUsdcTitle: "Insufficient USDC",
    paymasterUsdcMsg: "Not enough USDC on the paymaster network for this package.",
    paymasterChainTitle: "Paymaster network required",
    paymasterChainMsg: "Switch to the paymaster network or add USDC.",
    pendingTitle: "Waiting for confirmation",
  },

  errors: {
    unknown: "Transaction failed — unknown error.",
    cancelled: "Transaction cancelled in your wallet.",
    insufficient: "Insufficient balance for this payment.",
    deliveryUnavailable: "Delivery is temporarily unavailable. Please try again later.",
    depositMismatch: "Payment did not reach treasury or amount mismatch. Check network and amount.",
    wrongChain: "Wallet on wrong network — switch to the payment network and retry.",
    chainNotAdded: "Network not in wallet — add Sepolia, Base Sepolia, or Monad Testnet.",
    timeout: "Server timed out — check connection and retry.",
    usdcFailed: "USDC transfer failed on-chain.",
    nativeFailed: "Native deposit failed on-chain.",
  },

  admin: {
    title: "Admin",
    subtitle: "Treasury wallet verified access",
    notConfigured:
      "Admin wallet is not configured on the server. On testnet, connect the operator/collector wallet.",
    connectWallet: "Connect wallet",
    signIn: "Verify with wallet",
    signingIn: "Signing…",
    sessionOpen: "Signed in — treasury data loaded",
    connectFirst: "Connect your wallet first.",
    challengeFailed: "Could not start verification.",
    unauthorized: "Unauthorized wallet or invalid signature.",
    signInFailed: "Sign-in failed.",
    expectedWallet: "Expected admin wallet",
    loadFailed: "Could not load treasury data.",
    refresh: "Refresh",
    signOut: "Sign out",
    volume: "Volume",
    orders: "Orders",
    totalDeposits: "Total deposits",
    margin: "Treasury margin",
    vaultContents: "Vault contents",
    balanceUnreadable: "Could not read balance.",
    openOrders: "{count} open orders waiting",
    userMessages: "User messages",
    noMessages: "No messages yet.",
    clickToExpand: " · click to expand",
    deleteMessage: "Delete message",
    verifyTitle: "Gas Pool — verification",
    verifyDetail:
      "Sign with your admin wallet to continue. The address is not shown in the browser.",
    verifyButton: "Verify with wallet",
    guardLoading: "Loading…",
    guardMisconfigured: "Admin configuration missing",
    guardMisconfiguredDetail:
      "On testnet the operator wallet is admin by default. Set ADMIN_WALLET_ADDRESS on mainnet.",
    guardRedirect: "Redirecting to Get Gas…",
  },

  common: {
    ok: "OK",
    close: "Close",
    dismiss: "Dismiss",
    explorer: "View on explorer",
  },
} as const;

export type Messages = typeof messages;

/** Safe access — avoids runtime undefined on partial deploys */
export function msg<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback;
}
