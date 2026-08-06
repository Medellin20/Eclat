import type { Metadata } from 'next';
import { Suspense } from 'react';
import BookingForm from '@/components/BookingForm';
import { Chargement } from '@/components/Etats';

export const metadata: Metadata = {
  title: 'Réserver une séance',
  description: 'Choisissez un praticien, une date, une durée et un format de séance.',
};

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">Réservation</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.06] tracking-tight text-encre sm:text-5xl">
          Choisissez votre créneau
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ardoise">
          L’appel vidéo est accessible uniquement après confirmation du paiement
          sécurisé par PayPal.
        </p>
      </header>

      <Suspense fallback={<Chargement label="Préparation du formulaire" />}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
