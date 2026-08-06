'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarX2, Clock, MapPin, Video } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SESSION_LABELS, STATUS_LABELS, type BookingStatus } from '@/types';
import { formatDate, formatDuration, formatPrice } from '@/lib/format';
import { Chargement, Vide } from '@/components/Etats';

const COULEURS: Record<BookingStatus, string> = {
  en_attente: 'bg-rose-wash text-prune-deep',
  confirmee: 'bg-emerald-50 text-emerald-800',
  annulee: 'bg-brume text-ardoise',
};

export default function BookingHistory() {
  const { bookings, ready, cancelBooking } = useApp();

  if (!ready) return <Chargement label="Chargement de vos séances" />;

  if (bookings.length === 0) {
    return (
      <Vide
        icone={<CalendarX2 size={22} aria-hidden="true" />}
        titre="Aucune séance pour l’instant"
        texte="Dès que vous réservez, la séance apparaît ici avec sa date, son format et son statut."
        action={
          <Link href="/bookings" className="btn-primaire">
            Réserver une séance
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <li key={b.id} className="surface overflow-hidden">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl">
              <Image src={b.coachPhoto} alt="" fill sizes="80px" className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-xl leading-tight text-encre">{b.coachName}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider ${COULEURS[b.status]}`}
                >
                  {STATUS_LABELS[b.status]}
                </span>
              </div>

              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ardoise">
                <span className="first-letter:uppercase">{formatDate(b.date)}</span>
                <span className="tabulaire flex items-center gap-1.5">
                  <Clock size={13} aria-hidden="true" />
                  {b.time} · {formatDuration(b.durationHours)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} aria-hidden="true" />
                  {SESSION_LABELS[b.sessionType]}
                </span>
              </p>

              {b.message && (
                <p className="mt-3 rounded-2xl bg-porcelaine px-4 py-3 text-sm leading-relaxed text-ardoise">
                  {b.message}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
              <p className="tabulaire font-display text-2xl text-prune-deep">
                {formatPrice(b.total)}
              </p>
              {b.status !== 'annulee' && (
                <button
                  type="button"
                  onClick={() => cancelBooking(b.id)}
                  className="text-xs font-semibold text-ardoise underline-offset-4 transition-colors hover:text-rose hover:underline"
                  aria-label={`Annuler la séance avec ${b.coachName} du ${formatDate(b.date)}`}
                >
                  Annuler
                </button>
              )}
              {b.sessionType === 'visio' && b.status === 'confirmee' && b.paypalReference && (
                <Link href={`/video-call?booking=${encodeURIComponent(b.id)}`} className="btn-secondaire text-xs">
                  <Video size={14} aria-hidden="true" />
                  Ouvrir l’appel
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
