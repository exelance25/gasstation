"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Globe, KeyRound, ShieldCheck, Unplug } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeWalletRisk } from "@/security/risk-engine";
import { walletService } from "@/wallets/wallet-service";
import { useToastStore } from "@/stores/use-toast-store";

const mockSites = ["app.onebalance.io", "merchant.demo", "swap.partner"];
const mockApprovals = [
  { token: "USDC", spender: "0xBridge...", risk: "low" },
  { token: "UNKNOWN", spender: "0xFake...", risk: "high" }
];
const mockActivity = [
  { action: "Wallet connect", status: "verified", time: "2m ago" },
  { action: "Approval request", status: "blocked", time: "18m ago" },
  { action: "Cross-chain intent", status: "pending", time: "1h ago" }
];

export function SecurityCenterPanel() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const risk = computeWalletRisk(mockSites.length, mockApprovals.length);

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">{t("riskScore")}</p>
            <p className="text-2xl font-semibold capitalize">{risk}</p>
          </div>
          <ShieldCheck className="text-primary" size={28} />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: risk === "low" ? "28%" : risk === "medium" ? "58%" : "82%" }}
            className="h-full bg-primary-gradient"
          />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Globe size={16} />
          <p className="font-medium">{t("connectedSites")}</p>
          <Badge>{mockSites.length}</Badge>
        </div>
        <ul className="space-y-2">
          {mockSites.map((site) => (
            <li key={site} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
              <span>{site}</span>
              <Badge variant="success">Verified</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <KeyRound size={16} />
          <p className="font-medium">{t("activeApprovals")}</p>
        </div>
        <ul className="space-y-2">
          {mockApprovals.map((a) => (
            <li key={a.spender} className="rounded-2xl bg-white/5 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{a.token}</span>
                <Badge variant={a.risk === "high" ? "danger" : "success"}>{a.risk}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{a.spender}</p>
              {a.risk === "high" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
                  <AlertTriangle size={12} /> Fake token indicator
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-3 font-medium">{t("recentActivity")}</p>
        <ul className="space-y-2">
          {mockActivity.map((item) => (
            <li key={item.action} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
              <span>{item.action}</span>
              <span className="text-xs text-muted">{item.time}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-2 font-medium">{t("permissions")}</p>
        <p className="text-xs text-muted">Sign-only · No private key export · Session encrypted</p>
      </Card>

      <Button
        className="flex items-center justify-center gap-2 bg-red-500/80"
        onClick={() => {
          walletService.clear();
          showToast(t("emergencyDisconnect"));
        }}
      >
        <Unplug size={16} />
        {t("emergencyDisconnect")}
      </Button>
    </div>
  );
}
