"use client";

import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/use-app-store";
import type { AppLocale } from "@/types";

const locales: { id: AppLocale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "tr", label: "Turkce" }
];

export default function LanguageSettingsPage() {
  const { i18n, t } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const switchLocale = (id: AppLocale) => {
    setLocale(id);
    i18n.changeLanguage(id);
  };

  return (
    <AppShell title={t("language")}>
      <div className="space-y-2">
        {locales.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchLocale(item.id)}
            className={`glass w-full rounded-3xl p-4 text-left text-sm transition hover-glow ${
              locale === item.id ? "ring-1 ring-primary/50" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
