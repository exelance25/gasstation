"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BrandLogo } from "@/components/brand/one-coin-icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <Card className="flex items-center gap-4">
        <BrandLogo size="lg" />
        <div>
          <p className="text-lg font-semibold text-foreground">User</p>
          <Badge variant="success">Verified</Badge>
        </div>
      </Card>
      <Link href="/connected-wallets" className="glass tap-fast mt-3 block rounded-2xl p-4 text-sm text-accent">
        Connected Wallets →
      </Link>
    </AppShell>
  );
}
