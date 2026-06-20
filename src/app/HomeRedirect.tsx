"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ana sayfa — client boundary (Next 15.5 manifest bug workaround) */
export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/yakit-al");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal">
      <p className="text-sm text-neutral-400">GASSTATION yükleniyor…</p>
    </main>
  );
}
