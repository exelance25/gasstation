import { notFound } from "next/navigation";
import { FeaturePageClient } from "@/components/shared/feature-page-client";
import { featureRegistry } from "@/constants/page-registry";

export default async function GenericFeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const config = featureRegistry[feature];
  if (!config) notFound();

  return (
    <FeaturePageClient
      feature={feature}
      title={config.title}
      subtitle={config.subtitle}
      ctaHref={config.ctaHref}
      ctaLabel={config.ctaLabel}
    />
  );
}

export function generateStaticParams() {
  return Object.keys(featureRegistry).map((feature) => ({ feature }));
}
