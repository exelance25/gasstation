"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FastLink } from "@/components/ui/fast-link";

export function FeaturePage({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  children
}: {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <AppShell title={title}>
      <Card>
        <p className="text-base text-primary/80">{subtitle}</p>
        {children}
        {ctaHref && ctaLabel && (
          <FastLink href={ctaHref} className="mt-4">
            <Button>{ctaLabel}</Button>
          </FastLink>
        )}
      </Card>
    </AppShell>
  );
}
