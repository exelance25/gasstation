"use client";

import { ProtocolBar } from "@/components/landing/ProtocolBar";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VisionSection } from "@/components/landing/VisionSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function GasStationLandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[#030712] text-zinc-100">
      <ProtocolBar />
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorks />
        <VisionSection />
      </main>
      <LandingFooter />
    </div>
  );
}
