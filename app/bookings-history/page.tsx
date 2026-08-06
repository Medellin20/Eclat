import type { Metadata } from 'next';
import BookingHistory from '@/components/BookingHistory';

export const metadata: Metadata = {
  title: 'Mes séances',
  description: 'Historique de vos réservations : date, heure, durée, format, prix et statut.',
};

export default function HistoriquePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-8 pt-14 sm:px-8">
      <header className="mb-10">
        <p className="eyebrow">Historique</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.06] tracking-tight text-encre sm:text-5xl">
          Mes séances
        </h1>
        <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-ardoise">
          Toutes vos demandes, de la plus récente à la plus ancienne. Les données
          restent dans ce navigateur.
        </p>
      </header>

      <BookingHistory />
    </div>
  );
}
