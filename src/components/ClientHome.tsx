"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** @deprecated /yakit-al kullanın */
export function ClientHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/yakit-al");
  }, [router]);
  return null;
}
