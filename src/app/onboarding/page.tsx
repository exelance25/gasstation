"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/one-coin-icon";
import { Button } from "@/components/ui/button";

const steps = ["onboardingStep1", "onboardingStep2", "onboardingStep3"] as const;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-background px-5 py-10">
      <div className="flex justify-center">
        <BrandLogo size="md" />
      </div>
      <section className="glass mt-10 flex flex-1 flex-col justify-center rounded-3xl p-8">
        <p className="text-sm text-accent">
          {step + 1} / {steps.length}
        </p>
        <h2 className="mt-4 text-2xl font-bold text-foreground">{t(steps[step])}</h2>
      </section>
      <div className="mt-6">
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>{t("continue")}</Button>
        ) : (
          <Button onClick={() => router.push("/wallet-connect")}>{t("connectWallet")}</Button>
        )}
      </div>
    </main>
  );
}
