"use client";

import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/app-shell";
import { SecurityCenterPanel } from "@/features/security/security-center-panel";

export default function SecurityCenterPage() {
  const { t } = useTranslation();
  return (
    <AppShell title={t("securityCenter")}>
      <SecurityCenterPanel />
    </AppShell>
  );
}
