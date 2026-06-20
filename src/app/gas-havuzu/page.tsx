"use client";

import { GasStationPage } from "@/components/GasStationPage";
import { GasHavuzuGuard } from "@/components/GasHavuzuGuard";
import { PumpDashboard } from "@/components/PumpDashboard";

/** Gas Havuzu — sunucu admin oturumu + cüzdan imzası */
export default function GasHavuzuPage() {
  return (
    <GasStationPage variant="pool">
      <GasHavuzuGuard>
        <PumpDashboard />
      </GasHavuzuGuard>
    </GasStationPage>
  );
}
