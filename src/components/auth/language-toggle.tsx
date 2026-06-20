"use client";

import { useTranslation } from "react-i18next";
import { useTekBakiyeStore } from "@/lib/store";
import type { AppLocale } from "@/types";
import { cn } from "@/lib/utils";

const locales: { id: AppLocale; label: string }[] = [
  { id: "tr", label: "TR" },
  { id: "en", label: "EN" }
];

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const locale = useTekBakiyeStore((s) => s.locale);
  const setLocale = useTekBakiyeStore((s) => s.setLocale);

  const switchLocale = (id: AppLocale) => {
    setLocale(id);
    void i18n.changeLanguage(id);
  };

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <span className="text-xs font-medium text-monad-ink/60">{t("language")}</span>
      <div className="embossed flex rounded-2xl bg-white/40 p-1">
        {locales.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchLocale(item.id)}
            className={cn(
              "tap-fast min-w-[3rem] rounded-xl px-3 py-1.5 text-sm font-bold transition",
              locale === item.id
                ? "bg-monad-500 text-white shadow-monad"
                : "text-monad-ink/70 hover:bg-white/50"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
