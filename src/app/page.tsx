import type { Metadata } from "next";
import { GasStationLandingPage } from "@/components/landing/GasStationLandingPage";

export const metadata: Metadata = {
  title: "GASSTATION — Instant USDC to Native Gas",
  description:
    "Convert USDC into ETH, Base ETH, SOL, and more. No bridges. No exchanges. GASSTATION delivers the exact gas token you need — instantly.",
  openGraph: {
    title: "GASSTATION",
    description: "Cross-chain gas station. USDC → native gas in seconds.",
    type: "website",
  },
  keywords: [
    "gas station",
    "USDC to ETH",
    "cross-chain gas",
    "GASSTATION",
    "fee abstraction",
    "Web3 gas",
  ],
};

export default function HomePage() {
  return <GasStationLandingPage />;
}
