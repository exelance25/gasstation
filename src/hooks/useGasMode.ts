"use client";

import { useGasModeContext } from "@/providers/GasModeProvider";

export function useGasMode() {
  return useGasModeContext();
}
