"use client";

import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { enterApp } from "@/features/auth/quick-login";
import { isQuickLoginEnabled } from "@/config/quick-login";

type QuickGirisButtonProps = {
  className?: string;
  label?: string;
  variant?: "primary" | "outline";
};

export function QuickGirisButton({
  className,
  label,
  variant = "primary"
}: QuickGirisButtonProps) {
  const { t } = useTranslation();

  if (!isQuickLoginEnabled()) return null;

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={() => enterApp("/")}
        className={
          variant === "outline"
            ? "embossed w-full border-0 bg-white/50 text-base font-bold tracking-wide text-monad-ink hover:bg-white/70"
            : "embossed w-full border-0 bg-monad-500 text-base font-bold tracking-wide text-white shadow-monad hover:bg-monad-600"
        }
      >
        <LogIn size={20} className="mr-2 inline shrink-0" />
        {label ?? t("quickEnter")}
      </Button>
      {variant === "primary" && (
        <p className="mt-2 text-center text-xs text-monad-ink/70">{t("quickEnterHint")}</p>
      )}
    </div>
  );
}
