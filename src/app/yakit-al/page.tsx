"use client";

import { GasStationPage } from "@/components/GasStationPage";
import { YakitAl } from "@/components/YakitAl";

/** YAKIT AL — tam client sayfa (manifest / RSC uyumu) */
export default function YakitAlPage() {
  return (
    <GasStationPage variant="fuel">
      <YakitAl />
    </GasStationPage>
  );
}
