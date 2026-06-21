/** User-facing copy — English (community launch) */

export const messages = {
  appName: "GASSTATION",
  tagline: "Pay with USDC, ETH, BASE, or MON — receive ETH, BASE, or MON gas",
  supportedGasNetworks: "ETH · Base · Monad · Solana",
  depositUsdcNetworks: "Ethereum · Base · Monad · Solana (Circle USDC)",
  supportedPayAssets: "ETH · BASE · MON · USDC",
  walletConsent:
    "I allow read-only balance access for payments. My address is not stored on the server.",
  depositHint: "Connect → pick balance → enter amount → FIRE.",
  solDeliveryHint:
    "Enter a Solana address for SOL delivery. Pay with Circle USDC on Ethereum, Base, Monad, or Solana.",

  fire: "FIRE",
  firing: "PROCESSING…",
  locked: "LOCKED…",

  pump: {
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
    collectorTitle: "Collector not configured",
    collectorMsg: "Operator treasury is not ready — try again later.",
    autoOffTitle: "Automatic mode off",
    autoOffMsg: "Enable NEXT_PUBLIC_AUTO_FEE_ENABLED or use manual mode.",
    tankTitle: "Gas tank not ready",
    tankMsg: "Operator wallet needs more ETH / BASE / MON for delivery.",
    precheckTitle: "Checking treasury",
    precheckMsg: "Verifying operator tank before delivery…",
  },

  errors: {
    unknown: "Transaction failed — unknown error.",
    cancelled: "Transaction cancelled in your wallet.",
    insufficient: "Insufficient balance for this payment.",
    tankEmpty:
      "Gas tank empty or low — fund operator wallet with Sepolia ETH / Base ETH / MON.",
    depositMismatch: "Payment did not reach treasury or amount mismatch. Check network and amount.",
    wrongChain: "Wallet on wrong network — switch to the payment network and retry.",
    chainNotAdded: "Network not in wallet — add Sepolia, Base Sepolia, or Monad Testnet.",
    collectorMissing: "GASSTATION collector not configured (COLLECTOR_ADDRESS).",
    timeout: "Server timed out — check connection and retry.",
    usdcFailed: "USDC transfer failed on-chain.",
    nativeFailed: "Native deposit failed on-chain.",
    walletRequired: "Connect an EVM or Solana wallet.",
    amountRequired: "Enter the gas amount you want to buy.",
  },

  admin: {
    title: "Admin",
    subtitle: "Treasury wallet verified access",
    notConfigured:
      "Admin wallet not configured on server. On testnet, connect the operator/collector wallet.",
    connectWallet: "Connect wallet",
    signIn: "Verify with wallet",
    signingIn: "Signing…",
    sessionOpen: "Signed in — treasury data loaded",
    connectFirst: "Connect your wallet first.",
    challengeFailed: "Could not start verification.",
    unauthorized: "Unauthorized wallet or invalid signature.",
    signInFailed: "Sign-in failed.",
    expectedWallet: "Expected admin wallet",
  },

  wallets: {
    recommended: "Recommended",
    more: "More wallets",
    phantomSub: "EVM approval → Solana approval",
    rabby: "Rabby",
    phantom: "Phantom",
    metamask: "MetaMask",
    browserWallet: "Browser wallet",
  },
} as const;

export type Messages = typeof messages;
