import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1a0a2e] px-4">
      <h1 className="font-display text-2xl font-bold text-cyan-300">
        404 — Sayfa bulunamadı
      </h1>
      <Link
        href="/"
        className="mt-6 font-dotmatrix text-sm text-neon-purple hover:underline"
      >
        GASSTATION ana sayfa
      </Link>
    </main>
  );
}
