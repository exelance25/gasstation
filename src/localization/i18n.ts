"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/localization/resources";

const STORAGE_KEY = "tekbakiye-v1";

function readPersistedLocale(): string {
  if (typeof window === "undefined") return "tr";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "tr";
    const parsed = JSON.parse(raw) as { state?: { locale?: string } };
    return parsed.state?.locale === "en" ? "en" : "tr";
  } catch {
    return "tr";
  }
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: readPersistedLocale(),
    fallbackLng: "tr",
    interpolation: { escapeValue: false }
  });
}

export default i18n;
