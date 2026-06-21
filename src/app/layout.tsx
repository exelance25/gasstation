import type { Metadata } from "next";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GASSTATION",
    template: "%s · GASSTATION",
  },
  description:
    "Instant USDC to native gas — ETH, Base, Monad, Solana. Cross-chain fuel station.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-display antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
