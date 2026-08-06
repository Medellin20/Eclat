import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-28 border-t border-brume bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-prune to-rose text-white">
              <Sparkles size={15} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="font-display text-xl text-encre">Éclat</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ardoise">
            Plateforme de démonstration pour la réservation de séances de coaching
            et de bien-être. Le règlement des réservations est effectué sur le site
            sécurisé de PayPal.
          </p>
        </div>

        <nav aria-label="Pages">
          <h2 className="eyebrow">Pages</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
            <li><Link href="/" className="transition-colors hover:text-encre">Accueil</Link></li>
            <li><Link href="/bookings" className="transition-colors hover:text-encre">Réserver</Link></li>
            <li><Link href="/bookings-history" className="transition-colors hover:text-encre">Mes séances</Link></li>
            <li><Link href="/admin" className="transition-colors hover:text-encre">Administration</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow">Bon à savoir</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
            <li>Les visuels sont générés pour la démonstration.</li>
            <li>Données stockées dans votre navigateur.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brume">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-ardoise sm:px-8">
          © {new Date().getFullYear()} Éclat — projet de démonstration.
        </p>
      </div>
    </footer>
  );
}
