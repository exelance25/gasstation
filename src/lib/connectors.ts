import type { Connector } from "wagmi";

const PREFERRED_WALLET_ORDER = [
  "MetaMask",
  "Rabby",
  "Phantom",
  "Trust Wallet",
  "OKX Wallet",
  "Coinbase Wallet",
  "Base",
  "WalletConnect",
  "Rainbow",
  "Zerion",
  "Brave",
  "Ledger",
] as const;

function normalizeLabel(label: string): string {
  if (label === "Rabby Wallet") return "Rabby";
  if (label === "Base Account") return "Base";
  if (label === "Phantom EVM") return "Phantom";
  return label;
}

/** MetaMask, Rabby, Phantom, WalletConnect vb. — tekrarsız liste */
export function getWalletConnectors(connectors: readonly Connector[]): Connector[] {
  const byLabel = new Map<string, Connector>();

  for (const connector of connectors) {
    const label = normalizeLabel(getConnectorLabel(connector));

    if (label === "WalletConnect") {
      if (!byLabel.has("WalletConnect")) byLabel.set("WalletConnect", connector);
      continue;
    }

    if (label === "Browser wallet") {
      if (!byLabel.has("Browser wallet")) byLabel.set("Browser wallet", connector);
      continue;
    }

    if (!byLabel.has(label)) {
      byLabel.set(label, connector);
    }
  }

  const hasNamedWallet = [...byLabel.keys()].some(
    (k) => k !== "Browser wallet" && k !== "WalletConnect",
  );
  if (hasNamedWallet) {
    byLabel.delete("Browser wallet");
  }

  return [...byLabel.values()].sort((a, b) => {
    const la = normalizeLabel(getConnectorLabel(a));
    const lb = normalizeLabel(getConnectorLabel(b));
    const ia = PREFERRED_WALLET_ORDER.indexOf(la as (typeof PREFERRED_WALLET_ORDER)[number]);
    const ib = PREFERRED_WALLET_ORDER.indexOf(lb as (typeof PREFERRED_WALLET_ORDER)[number]);
    if (ia === -1 && ib === -1) return la.localeCompare(lb);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function getConnectorLabel(connector: Connector): string {
  const name = connector.name?.trim();
  if (name && name !== "Injected") return name;

  if (connector.id === "io.metamask" || connector.id === "metaMask") return "MetaMask";
  if (connector.id === "io.rabby") return "Rabby";
  if (connector.id === "app.phantom") return "Phantom";
  if (connector.id === "backpack") return "Backpack";
  if (connector.id === "safe") return "Safe";
  if (connector.type === "walletConnect" || connector.id === "walletConnect")
    return "WalletConnect";
  if (connector.id === "injected") return "Browser wallet";

  return connector.id;
}

/** @deprecated Turkish alias */
export function getConnectorLabelTr(connector: Connector): string {
  const label = getConnectorLabel(connector);
  if (label === "Browser wallet") return "Cüzdan Bağla";
  return label;
}

export function hasWalletExtension(connectors: readonly Connector[]): boolean {
  return getWalletConnectors(connectors).length > 0;
}
