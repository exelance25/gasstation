"use client";

import { useRouter } from "next/navigation";
import { FeaturePage } from "@/components/shared/feature-page";
import { CrossChainPaymentForm } from "@/features/payments/cross-chain-payment-form";
import { QrPaymentPanel } from "@/features/qr/qr-payment-panel";
import { PaymentSuccessPanel } from "@/features/payments/payment-success-panel";

const interactiveFeatures = new Set(["cross-chain-payment", "qr-payment", "payment-success"]);

export function FeaturePageClient({
  feature,
  title,
  subtitle,
  ctaHref,
  ctaLabel
}: {
  feature: string;
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const router = useRouter();

  let content: React.ReactNode = null;
  if (feature === "cross-chain-payment") content = <CrossChainPaymentForm />;
  if (feature === "qr-payment") content = <QrPaymentPanel />;
  if (feature === "payment-success") content = <PaymentSuccessPanel />;

  return (
    <FeaturePage
      title={title}
      subtitle={subtitle}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
    >
      {content}
      {!interactiveFeatures.has(feature) && (
        <button
          type="button"
          className="mt-4 text-sm text-primary underline"
          onClick={() => router.back()}
        >
          Go back
        </button>
      )}
    </FeaturePage>
  );
}
