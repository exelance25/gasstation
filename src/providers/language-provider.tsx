"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTekBakiyeStore } from "@/lib/store";

/** Keeps i18next in sync with Zustand persisted locale */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useTekBakiyeStore((s) => s.locale);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return children;
}
