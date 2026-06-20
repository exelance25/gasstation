"use client";

import { PumpStationPage } from "@/components/PumpStationPage";
import { GasHavuzuGuard } from "@/components/GasHavuzuGuard";
import { PumpDashboard } from "@/components/PumpDashboard";

/** Gas Havuzu — sunucu admin oturumu + cüzdan imzası */
export default function GasHavuzuPage() {
  return (
    <PumpStationPage variant="pool">
      <GasHavuzuGuard>
        <PumpDashboard />
      </GasHavuzuGuard>
    </PumpStationPage>
  );
}
