import type { NextConfig } from "next";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyDevTlsBypass } = require("./scripts/ensure-dev-tls.cjs") as {
  applyDevTlsBypass: () => void;
};

/** next.config yüklenmeden önce — font + oracle TLS bypass (yalnızca dev) */
applyDevTlsBypass();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ["127.0.0.1:3000", "localhost:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },
  transpilePackages: [
    "@pumpstation/gas-engine",
    "@pumpstation/fee-sdk",
    "@pumpstation/sdk",
  ],
  webpack: (config, { dev }) => {
    // Windows: PackFileCacheStrategy ENOENT/rename — bellek önbelleği kullan
    if (dev) {
      config.cache = { type: "memory" };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@pumpstation/gas-engine": path.resolve(__dirname, "packages/gas-engine-stub"),
      "@pumpstation/fee-sdk": path.resolve(__dirname, "packages/fee-sdk/src"),
      "@pumpstation/sdk": path.resolve(__dirname, "sdk/src"),
      "pino-pretty": false,
    };
    // TypeScript paketlerinde .js uzantılı importlar (fee-sdk)
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
