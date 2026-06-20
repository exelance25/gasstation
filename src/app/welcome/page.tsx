"use client";

import { useTranslation } from "react-i18next";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { LanguageToggle } from "@/components/auth/language-toggle";
import { QuickGirisButton } from "@/components/auth/quick-giris-button";

/** Giriş ekranı — splash sonrası (1 sn logo) */
export default function WelcomePage() {
  const { t } = useTranslation();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col overflow-hidden bg-monad-auth px-5 pb-10 pt-8">
      <div className="pointer-events-none absolute inset-0 bg-monad-glow opacity-80" aria-hidden />

      <div className="relative z-10 flex items-start justify-between">
        <div className="w-20" />
        <LanguageToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="embossed-3d mb-6 rounded-full p-3">
          <BrandWordmark size="hero" variant="auth" showTagline tagline={t("brandTagline")} />
        </div>
        <h1 className="text-2xl font-bold leading-tight text-monad-ink sm:text-3xl">{t("welcomeTitle")}</h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-monad-ink/75">{t("welcomeSubtitle")}</p>
      </div>

      <section className="relative z-10 space-y-3">
        <div className="embossed rounded-3xl bg-white/45 p-5 backdrop-blur-sm">
          <QuickGirisButton />
        </div>
      </section>
    </main>
  );
}
