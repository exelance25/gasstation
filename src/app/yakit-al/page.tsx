"use client";

import { PumpStationPage } from "@/components/PumpStationPage";
import { YakitAl } from "@/components/YakitAl";

/** YAKIT AL — tam client sayfa (manifest / RSC uyumu) */
export default function YakitAlPage() {
  return (
    <PumpStationPage variant="fuel">
      <YakitAl />
    </PumpStationPage>
  );
}
