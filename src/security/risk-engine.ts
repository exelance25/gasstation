import type { WalletRiskLevel } from "@/types";

export function computeWalletRisk(connectedSites: number, activeApprovals: number): WalletRiskLevel {
  if (connectedSites > 10 || activeApprovals > 20) return "high";
  if (connectedSites > 4 || activeApprovals > 8) return "medium";
  return "low";
}
