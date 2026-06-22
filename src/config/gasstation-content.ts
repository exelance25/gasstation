/**
 * GASSTATION public copy + GitHub links (English — user-facing).
 */

const REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "https://github.com/exelance25/gasstation";

export const GITHUB_LINKS = {
  repo: REPO,
  sdk: `${REPO}/tree/main/sdk`,
  feeSdk: `${REPO}/tree/main/packages/fee-sdk`,
  gasEngine: `${REPO}/tree/main/packages/gas-engine-stub`,
  integrators: `${REPO}/tree/main/docs/INTEGRATORS.md`,
  contracts: `${REPO}/tree/main/contracts`,
} as const;

export const GASSTATION_MISSION =
  "Nobody should be blocked from transacting because they lack gas on the right chain. Pay with USDC or native tokens and receive instant native gas — wallet, dApp, or backend.";

export const GASSTATION_VISION =
  "The fuel station for every chain: one protocol, many networks, transparent pricing. From Monad to Solana — NFT mints to trading bots — gas delivery as infrastructure.";

export const HOW_GASSTATION_WORKS = [
  {
    title: "Connect and pick your destination",
    text: "Connect MetaMask or a Solana wallet. Choose the gas network (ETH, MON, BASE, SOL, USDC) and the address that receives it.",
  },
  {
    title: "Enter amount and see live pricing",
    text: "Type how much gas you need. The oracle shows estimated payment and delivery with a conservative buffer.",
  },
  {
    title: "Pay and FIRE",
    text: "Pay with USDC or native token to the treasury. After confirmation, native gas is sent to your destination — no extra signatures.",
  },
] as const;

export const AUTO_FEE_ARCHITECTURE = {
  title: "Automatic gas — 3 layers",
  layers: [
    {
      name: "Layer 1 — SDK",
      detail: "Your app calls gasStation.pay(). The SDK checks network, balance, and gas estimate.",
    },
    {
      name: "Layer 2 — Quoter",
      detail:
        "Backend converts USDC, MON, BASE, or DAI into delivery gas and returns gasNeeded, cost, and fee.",
    },
    {
      name: "Layer 3 — Liquidity Engine",
      detail:
        "Treasury routes payment, verifies operator tanks, and executes delivery on the target chain.",
    },
  ],
} as const;

export const AUTO_FEE_EXPLAINER = {
  title: "What is automatic gas?",
  summary:
    "Lets users transact without holding native gas on the destination chain. A sponsor covers gas; fees are collected after a signed quote.",
  useCases: [
    {
      vertical: "Monad / Base dApps",
      detail: "Top up gas before first swap or mint — via fee-sdk or REST dispense.",
    },
    {
      vertical: "NFT launchpads",
      detail: "Deliver MON/ETH before mint when the user pays with USDC or native.",
    },
    {
      vertical: "Trading bot platforms",
      detail: "Bulk-fund worker wallets from your backend via REST or SDK.",
    },
    {
      vertical: "Gasless checkout (ERC-4337)",
      detail: "@gasstation/sdk + relayer — pay with USDC, collect via paymaster postOp.",
    },
  ],
} as const;

export type SdkPackageMeta = {
  id: string;
  npmName: string;
  tagline: string;
  audience: string;
  install: string;
  githubPath: keyof typeof GITHUB_LINKS;
  features: string[];
  exampleSnippet: string;
};

export const SDK_PACKAGES: SdkPackageMeta[] = [
  {
    id: "sdk",
    npmName: "@gasstation/sdk",
    tagline: "gasStation.pay() — network, balance, quote, delivery",
    audience: "dApps, wallets, checkout flows",
    install: "npm install @gasstation/sdk viem",
    githubPath: "sdk",
    features: [
      "GasStation.pay() — full automatic gas flow",
      "Quoter client — USDC / MON / BASE / DAI → ETH",
      "Liquidity-aware quotes from the treasury engine",
      "REST fallback — oracle, intent, dispense",
    ],
    exampleSnippet: `import { GasStation } from "@gasstation/sdk";

const gasStation = new GasStation({ apiUrl: "https://gasstation-flame.vercel.app" });
const quote = await gasStation.quote({
  deliveryAsset: "ETH",
  paymentToken: "USDC",
  gasEstimateWei: "2100000000000000",
});
// { gasNeeded: "0.00013 ETH", cost: "0.42 USDC", fee: "0.05 USDC" }`,
  },
  {
    id: "fee-sdk",
    npmName: "@gasstation/fee-sdk",
    tagline: "3-step B2B gas settlement",
    audience: "Wallet, DEX, custodial backends",
    install: "npm install file:./packages/fee-sdk",
    githubPath: "feeSdk",
    features: [
      "getQuote — signed native payment offer",
      "settleFee — deliver gas after payment tx",
      "prepareSponsorship — gas engine compatible sponsor",
      "verifyQuote — replay protection",
    ],
    exampleSnippet: `import { GasStationFee } from "@gasstation/fee-sdk";

const fee = new GasStationFee({ apiUrl: "https://gasstation-flame.vercel.app" });
const quote = await fee.getQuote({ chain: "monad-testnet", paymentToken: "MON", gasEstimateWei: "2100000000000000" });`,
  },
  {
    id: "gas-engine",
    npmName: "@gasstation/gas-engine",
    tagline: "Gas sponsorship + automatic fee orchestration",
    audience: "Games, NFTs — no gas on first tx",
    install: "npm install file:./packages/gas-engine-stub",
    githubPath: "gasEngine",
    features: [
      "checkGasEligibility — native balance vs estimated gas",
      "requestGasSponsorship — settlement quote",
      "settleAutoFee — pay + deliver in one flow",
      "getOptimalRoute — multi-wallet routing stub",
    ],
    exampleSnippet: `import { GasStationClient } from "@gasstation/gas-engine";

const client = new GasStationClient({ settlementUrl: "https://gasstation-flame.vercel.app" });
const sponsor = await client.requestGasSponsorship({ userAddress: "0x…", chainId: 10143, intentId: "order-123" });`,
  },
  {
    id: "rest",
    npmName: "GasStationRestClient",
    tagline: "Raw REST — fastest POC",
    audience: "Hackathon, scripts, bot platforms",
    install: "npm install @gasstation/sdk",
    githubPath: "integrators",
    features: [
      "POST /api/v1/quote/gas — Layer 2 Quoter",
      "GET /api/oracle/quote",
      "POST /api/gas/precheck | intent | dispense",
      "Production rate limits — partner keys coming soon",
    ],
    exampleSnippet: `import { GasStationRestClient } from "@gasstation/sdk";

const api = new GasStationRestClient({ baseUrl: "https://gasstation-flame.vercel.app" });
const quote = await api.getOracleQuote({ deliveryAmount: 1, asset: "MON" });`,
  },
];
