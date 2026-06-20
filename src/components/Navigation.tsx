"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession } from "@/hooks/useAdminSession";

export function Navigation() {
  const pathname = usePathname();
  const { authenticated } = useAdminSession();

  if (!authenticated) return null;

  return (
    <nav
      className="relative z-20 flex w-full max-w-[800px] justify-end"
      aria-label="Admin menü"
    >
      <Link
        href="/gas-havuzu"
        className={`rounded px-3 py-1.5 text-sm font-bold transition ${
          pathname === "/gas-havuzu"
            ? "bg-purple-600 text-white ring-2 ring-purple-400"
            : "bg-purple-600/80 text-white hover:bg-purple-500"
        }`}
      >
        GAS HAVUZU
      </Link>
    </nav>
  );
}
