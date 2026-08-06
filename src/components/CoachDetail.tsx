'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarCheck, MapPin, UserSearch, Video } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatPrice } from '@/lib/format';
import Stars from '@/components/Stars';
import MediaGallery from '@/components/MediaGallery';
import { Chargement, Vide } from '@/components/Etats';

export default function CoachDetail({ id }: { id: string }) {
  const { getCoach, ready } = useApp();

  if (!ready) return <Chargement label="Chargement du profil" />;

  const coach = getCoach(id);

  if (!coach) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 sm:px-8">
        <Vide
          icone={<UserSearch size={22} aria-hidden="true" />}
          titre="Ce profil n'existe plus"
          texte="Il a peut-être été retiré depuis l'espace d'administration. Le praticien disponible n'est plus accessible."
          action={
            <Link href="/" className="btn-primaire">
              Retour au profil
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-8 pt-10 sm:px-8">
      <Link href="/" className="btn-fantome -ml-3 !px-3 text-sm">
        <ArrowLeft size={16} aria-hidden="true" />
        Retour au profil
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
        {/* Photo principale */}
        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-5xl border-[7px] border-white shadow-halo">
            <Image
              src={coach.mainPhoto}
              alt={`Portrait de ${coach.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <p className="tabulaire absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-6 py-3 font-display text-xl text-encre shadow-levee">
            {formatPrice(coach.hourlyRate)}
            <span className="ml-1 font-sans text-sm font-normal text-ardoise">par heure</span>
          </p>
        </div>

        {/* Informations */}
        <div className="pt-6 lg:pt-2">
          <p className="eyebrow">{coach.headline}</p>

          <h1 className="mt-3 font-display text-4xl leading-[1.06] tracking-tight text-encre sm:text-5xl">
            {coach.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ardoise">
            <span className="tabulaire">{coach.age} ans</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={2} aria-hidden="true" />
              {coach.location}
            </span>
          </div>

          <div className="mt-5">
            <Stars value={coach.rating} size={17} reviews={coach.reviews} />
          </div>

          <p className="mt-7 text-[0.98rem] leading-[1.75] text-ardoise">{coach.description}</p>

          <ul className="mt-7 flex flex-wrap gap-2">
            {coach.specialties.map((s) => (
              <li
                key={s}
                className="rounded-full border border-brume bg-white px-3.5 py-1.5 text-xs font-medium text-prune-deep"
              >
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/bookings?coach=${coach.id}`}
              className="btn-primaire flex-1"
              aria-label={`Réserver une séance avec ${coach.name}`}
            >
              <CalendarCheck size={16} strokeWidth={2.2} aria-hidden="true" />
              Réserver une séance
            </Link>
            <Link
              href={`/bookings?coach=${coach.id}`}
              className="btn-secondaire flex-1"
              aria-label={`Réserver et payer un appel vidéo avec ${coach.name}`}
            >
              <Video size={16} strokeWidth={2.2} aria-hidden="true" />
              Payer l’appel vidéo
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ardoise">
            Le paiement PayPal doit être confirmé avant l&apos;ouverture de la salle.
          </p>
        </div>
      </div>

      <MediaGallery coach={coach} />
    </div>
  );
}
