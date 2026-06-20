"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/one-coin-icon";
import { AuthForm } from "@/features/auth/auth-form";

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background px-5 py-10">
      <header className="flex flex-col items-center text-center">
        <BrandLogo size="lg" />
        <span className="mt-3 text-lg lowercase text-foreground">onebalance</span>
        <h1 className="mt-6 text-3xl font-bold text-foreground">{t("register")}</h1>
      </header>
      <section className="glass mt-8 rounded-3xl p-5">
        <AuthForm mode="register" />
      </section>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent underline">
          {t("login")}
        </Link>
      </p>
    </main>
  );
}
