export type RecipientKind = "evm" | "solana" | "ens" | "sol-domain" | "unknown";

export type ParsedRecipient = {
  raw: string;
  kind: RecipientKind;
  address: string;
  chainLabel: string;
  shortLabel: string;
};

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9-]+\.eth$/i;
const SOL_DOMAIN_REGEX = /^[a-zA-Z0-9-]+\.sol$/i;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function shortenAddress(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function parseRecipientInput(input: string): ParsedRecipient {
  const raw = input.trim();
  if (!raw) {
    return {
      raw: "",
      kind: "unknown",
      address: "",
      chainLabel: "Bilinmiyor",
      shortLabel: "Alıcı tanımlanamadı"
    };
  }

  if (EVM_REGEX.test(raw)) {
    return {
      raw,
      kind: "evm",
      address: raw,
      chainLabel: "Ethereum",
      shortLabel: `Alıcı: ${shortenAddress(raw)} (Ethereum)`
    };
  }

  if (ENS_REGEX.test(raw)) {
    return {
      raw,
      kind: "ens",
      address: raw,
      chainLabel: "Ethereum (ENS)",
      shortLabel: `Alıcı: ${raw} (ENS · Ethereum)`
    };
  }

  if (SOL_DOMAIN_REGEX.test(raw)) {
    return {
      raw,
      kind: "sol-domain",
      address: raw,
      chainLabel: "Solana",
      shortLabel: `Alıcı: ${raw} (Solana domain)`
    };
  }

  if (SOLANA_ADDRESS_REGEX.test(raw)) {
    return {
      raw,
      kind: "solana",
      address: raw,
      chainLabel: "Solana",
      shortLabel: `Alıcı: ${shortenAddress(raw, 4, 4)} (Solana)`
    };
  }

  return {
    raw,
    kind: "unknown",
    address: raw,
    chainLabel: "Tanımsız",
    shortLabel: "Geçerli bir adres veya domain girin"
  };
}
