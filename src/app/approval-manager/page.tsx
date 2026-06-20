"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/stores/use-toast-store";

const approvals = [
  { id: "1", token: "USDC", allowance: "$500", risk: "low" as const },
  { id: "2", token: "SCAM", allowance: "Unlimited", risk: "high" as const }
];

export default function ApprovalManagerPage() {
  const showToast = useToastStore((s) => s.show);

  return (
    <AppShell title="Approval Manager">
      <div className="space-y-3">
        {approvals.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{a.token}</p>
              <Badge variant={a.risk === "high" ? "danger" : "success"}>{a.risk}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{a.allowance}</p>
            <Button className="mt-3 bg-white/10" onClick={() => showToast(`Revoked ${a.token}`)}>
              Revoke
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
