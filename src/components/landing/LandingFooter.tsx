import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm font-semibold tracking-[0.2em] text-white">GASSTATION</p>
        <nav className="flex gap-6 text-sm text-zinc-500" aria-label="Alt menü">
          <Link href="/yakit-al" className="hover:text-white">
            Yakıt Al
          </Link>
          <a href="#nasil-kullanilir" className="hover:text-white">
            Nasıl Kullanılır
          </a>
          <a href="#vizyon" className="hover:text-white">
            Vizyon
          </a>
        </nav>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} GASSTATION</p>
      </div>
    </footer>
  );
}
