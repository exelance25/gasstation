"use client";

import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/app-shell";
import { WalletConnectPanel } from "@/features/wallet/wallet-connect-panel";

export default function WalletConnectPage() {
  const { t } = useTranslation();
  return (
    <AppShell title={t("connectWallet")}>
      <WalletConnectPanel />
    </AppShell>
  );
}
