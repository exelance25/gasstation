"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PumpPageBackground } from "@/components/PumpPageBackground";

type GasStationPageProps = {
  children: ReactNode;
  variant?: "fuel" | "pool";
};

export function GasStationPage({ children, variant = "fuel" }: GasStationPageProps) {
  if (variant === "pool") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#171d2a] px-3 py-4 sm:px-4">
        <PumpPageBackground />
        <div className="relative z-10 flex w-full max-w-[960px] flex-col items-center gap-3">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-start bg-[#171d2a] px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:justify-center sm:py-4 sm:px-4">
      <PumpPageBackground />
      <div className="relative z-10 flex w-full max-w-[960px] flex-col items-stretch gap-2 sm:items-center sm:gap-3">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </main>
  );
}
