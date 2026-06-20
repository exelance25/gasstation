/**
 * GASSTATION marka içeriği + GitHub bağlantıları.
 * GitHub push sonrası NEXT_PUBLIC_GITHUB_REPO ile güncelleyin.
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
  "Cross-chain dünyada kimse “gas’ım yok” diye işlem yapamasın. USDC veya native token ile öde; hedef ağda anında native gas al — cüzdan, dApp veya backend fark etmez.";

export const GASSTATION_VISION =
  "Her zincirin yakıt istasyonu: tek protokol, çoklu ağ, şeffaf fiyat. Monad’dan Solana’ya, NFT mint’ten trading bot’a — gas teslimi altyapı katmanı olmak.";

export const HOW_GASSTATION_WORKS = [
  {
    title: "Bağlan ve hedefi seç",
    text: "MetaMask veya Solana cüzdanını bağla. Gas almak istediğin ağı (ETH, MON, BASE, SOL) ve teslim adresini seç.",
  },
  {
    title: "Miktarı gir, canlı fiyatı gör",
    text: "Almak istediğin gas miktarını yaz. Oracle canlı fiyat + %5 arbitraj buffer ile tahmini ödeme ve teslim miktarını gösterir.",
  },
  {
    title: "Öde ve ATEŞLE",
    text: "USDC veya native token ile kasaya ödeme yap. Onay sonrası operatör kasası hedef adrese native gas gönderir — ek imza gerekmez.",
  },
] as const;

export const AUTO_FEE_EXPLAINER = {
  title: "Otomatik fee nedir?",
  summary:
    "Kullanıcının hedef ağda native gas tutmadan işlem yapabilmesi için tasarlanmış settlement katmanıdır. Gas sponsor devreye girer; ücret işlem sonrası imzalı quote ile tahsil edilir.",
  useCases: [
    {
      vertical: "Monad / Base dApp’leri",
      detail: "İlk swap veya mint öncesi kullanıcıya gas top-up — fee-sdk veya REST dispense ile.",
    },
    {
      vertical: "NFT launchpad",
      detail: "Mint öncesi MON/ETH yoksa treasury’den otomatik teslim; kullanıcı native ile öder.",
    },
    {
      vertical: "Trading bot platformları",
      detail: "Worker cüzdanlarına toplu gas funding — backend REST veya fee-sdk settle.",
    },
    {
      vertical: "Gasless checkout (ERC-4337)",
      detail: "@gasstation/sdk + relayer — USDC ile öde, paymaster postOp ile tahsil.",
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
    tagline: "On-chain + ERC-4337 paymaster entegrasyonu",
    audience: "Smart account / AA ekibi, gasless checkout",
    install: "npm install @gasstation/sdk viem",
    githubPath: "sdk",
    features: [
      "calculatePackageQuoteSync — ana uygulama ile senkron fiyatlandırma",
      "encodeBuyGasManuel — PumpPaymaster calldata",
      "PumpClient — relayer UserOp hazırlık/gönderim",
      "GasStationRestClient — REST oracle / intent / dispense",
    ],
    exampleSnippet: `import { PumpClient, calculatePackageQuoteSync } from "@gasstation/sdk";

const quote = calculatePackageQuoteSync(10, "MON");
console.log("Teslim:", quote.conservativeDeliveryAmount, "MON");`,
  },
  {
    id: "fee-sdk",
    npmName: "@gasstation/fee-sdk",
    tagline: "3 adımlı B2B gas settlement",
    audience: "Cüzdan, DEX, custodial uygulama backend’i",
    install: "npm install file:./packages/fee-sdk",
    githubPath: "feeSdk",
    features: [
      "getQuote — imzalı native ödeme teklifi",
      "settleFee — ödeme tx sonrası gas teslimi",
      "prepareSponsorship — gas engine uyumlu sponsor",
      "verifyQuote — replay koruması",
    ],
    exampleSnippet: `import { GasStationFee } from "@gasstation/fee-sdk";

const fee = new GasStationFee({ apiUrl: "http://localhost:4100" });
const quote = await fee.getQuote({ chain: "monad", paymentToken: "MON", gasEstimateWei: "2100000000000000" });
// Kullanıcı treasury'ye öder → settleFee(...)`,
  },
  {
    id: "gas-engine",
    npmName: "@gasstation/gas-engine",
    tagline: "Gas sponsorship + otomatik fee orchestration",
    audience: "dApp, oyun, NFT — ilk işlemde gas yok senaryosu",
    install: "npm install file:./packages/gas-engine-stub",
    githubPath: "gasEngine",
    features: [
      "checkGasEligibility — native bakiye vs tahmini gas",
      "requestGasSponsorship — settlement quote",
      "settleAutoFee — ödeme + teslim tek akış",
      "getOptimalRoute — çoklu cüzdan route stub",
    ],
    exampleSnippet: `import { GasStationClient } from "@gasstation/gas-engine";

const client = new GasStationClient({ settlementUrl: "http://localhost:4200" });
const sponsor = await client.requestGasSponsorship({
  userAddress: "0x…",
  chainId: 10143,
  intentId: "order-123",
});`,
  },
  {
    id: "rest",
    npmName: "GasStationRestClient",
    tagline: "Ham REST — en hızlı POC",
    audience: "Hackathon, script, bot platformu, internal ops",
    install: "npm install @gasstation/sdk  # rest-client export",
    githubPath: "integrators",
    features: [
      "GET /api/oracle/quote",
      "POST /api/gas/precheck | intent | dispense",
      "Rate limit — production partner key (yakında)",
      "1–2 haftada canlı POC",
    ],
    exampleSnippet: `import { GasStationRestClient } from "@gasstation/sdk";

const api = new GasStationRestClient({ baseUrl: "https://your-gasstation.app" });
const quote = await api.getOracleQuote({ deliveryAmount: 1, asset: "MON" });`,
  },
];
