export const featureRegistry: Record<
  string,
  { title: string; subtitle: string; ctaHref?: string; ctaLabel?: string }
> = {
  "unified-balance": {
    title: "Unified Balance",
    subtitle: "Cross-chain aggregation with one trusted banking view.",
    ctaHref: "/dashboard",
    ctaLabel: "Back to Home"
  },
  "cross-chain-payment": {
    title: "Cross-Chain Payment",
    subtitle: "Pay across Ethereum, Solana, and Monad with intent routing.",
    ctaHref: "/payment-success",
    ctaLabel: "Simulate Payment"
  },
  "qr-payment": {
    title: "QR Payment",
    subtitle: "Scan and pay with anti-phishing recipient verification."
  },
  "transaction-history": {
    title: "Transaction History",
    subtitle: "Track settlements, statuses, and chain execution logs."
  },
  notifications: {
    title: "Notifications",
    subtitle: "Real-time risk alerts, receipts, and status updates."
  },
  investments: {
    title: "Investments",
    subtitle: "Portfolio intelligence and protocol risk layers."
  },
  "bill-payments": {
    title: "Bill Payments",
    subtitle: "Fiat-ready bill rails with blockchain settlement abstraction."
  },
  "atm-withdrawal": {
    title: "ATM Withdrawal",
    subtitle: "Cardless ATM cashout flow with secure session controls."
  },
  settings: {
    title: "Settings",
    subtitle: "Environment, wallet policy, limits, and app personalization.",
    ctaHref: "/language-settings",
    ctaLabel: "Language Settings"
  },
  profile: {
    title: "Profile",
    subtitle: "Identity, verification status, and account preferences.",
    ctaHref: "/connected-wallets",
    ctaLabel: "Connected Wallets"
  },
  "connected-wallets": {
    title: "Connected Wallets",
    subtitle: "Manage linked EVM and Solana wallets with risk indicators.",
    ctaHref: "/wallet-connect",
    ctaLabel: "Manage Wallets"
  },
  "approval-manager": {
    title: "Approval Manager",
    subtitle: "Review allowances and revoke suspicious approvals quickly.",
    ctaHref: "/security-center",
    ctaLabel: "Security Center"
  },
  "payment-success": {
    title: "Payment Success",
    subtitle: "Premium post-payment confirmations and settlement proof timeline."
  }
};
