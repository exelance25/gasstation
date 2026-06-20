"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type FastLinkProps = React.ComponentProps<typeof Link> & {
  className?: string;
};

/** Prefetched navigation — avoids wrapping motion/button for snappier taps. */
export function FastLink({ className, children, prefetch = true, ...props }: FastLinkProps) {
  return (
    <Link prefetch={prefetch} className={cn("tap-fast block", className)} {...props}>
      {children}
    </Link>
  );
}
