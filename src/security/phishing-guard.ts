export type PhishingCheckResult = {
  level: "safe" | "warning" | "danger";
  reasons: string[];
};

export function evaluateContractInteraction(input: {
  contractAddress: string;
  isVerified: boolean;
  tokenSymbol?: string;
}): PhishingCheckResult {
  const reasons: string[] = [];
  if (!input.isVerified) reasons.push("Unverified contract");
  if (input.tokenSymbol?.toUpperCase() === "UNKNOWN") reasons.push("Fake token indicator");

  if (reasons.length > 1) return { level: "danger", reasons };
  if (reasons.length === 1) return { level: "warning", reasons };
  return { level: "safe", reasons: [] };
}

export function evaluateConnection(origin: string, knownOrigins: string[]) {
  if (!knownOrigins.includes(origin)) {
    return { level: "warning" as const, reasons: ["Unknown connection attempt"] };
  }
  return { level: "safe" as const, reasons: [] };
}
