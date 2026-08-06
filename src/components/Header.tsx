'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/bookings', label: 'Réserver' },
  { href: '/bookings-history', label: 'Mes séances' },
  { href: '/admin', label: 'Administration' },
];

export default function Header() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Referme le menu à chaque changement de page.
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  // Échap ferme le menu mobile.
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert]);

  const actif = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        compact
          ? 'border-b border-brume/80 bg-porcelaine/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Éclat — retour à l'accueil"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-prune via-prune-soft to-rose text-white shadow-douce transition-transform duration-500 group-hover:rotate-[-8deg]">
            <Sparkles size={17} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="font-display text-[1.35rem] leading-none tracking-tight text-encre">
            Éclat
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-9 md:flex">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="lien-nav"
              data-actif={actif(l.href)}
              aria-current={actif(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link href="/bookings" className="btn-primaire !px-5 !py-2.5">
            Prendre rendez-vous
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-2xl border border-brume bg-white text-encre md:hidden"
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {ouvert ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      <div
        id="menu-mobile"
        hidden={!ouvert}
        className="border-t border-brume bg-porcelaine/95 px-5 pb-6 pt-3 backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Navigation mobile" className="flex flex-col">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-2xl px-4 py-3.5 text-[0.95rem] font-medium transition-colors ${
                actif(l.href) ? 'bg-rose-wash text-prune-deep' : 'text-ardoise hover:bg-brume'
              }`}
              aria-current={actif(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/bookings" className="btn-primaire mt-3 w-full">
            Prendre rendez-vous
          </Link>
        </nav>
      </div>
    </header>
  );
}
