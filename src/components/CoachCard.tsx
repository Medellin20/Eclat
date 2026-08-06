import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { Coach } from '@/types';
import { formatPrice } from '@/lib/format';
import Stars from '@/components/Stars';

export default function CoachCard({ coach, priority = false }: { coach: Coach; priority?: boolean }) {
  return (
    <article className="groupe-carte surface flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-levee">
      <div className="medaillon aspect-[4/5] w-full">
        <Image
          src={coach.mainPhoto}
          alt={`Portrait de ${coach.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] [.groupe-carte:hover_&]:scale-[1.06]"
        />
        <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-prune-deep backdrop-blur">
          {formatPrice(coach.hourlyRate)}<span className="font-normal text-ardoise"> / h</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[1.4rem] leading-tight text-encre">{coach.name}</h3>
          <span className="tabulaire shrink-0 text-sm text-ardoise">{coach.age} ans</span>
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ardoise">
          <MapPin size={14} strokeWidth={2} aria-hidden="true" />
          {coach.location}
        </p>

        <div className="mt-3">
          <Stars value={coach.rating} reviews={coach.reviews} showValue={false} />
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-ardoise">{coach.headline}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {coach.specialties.slice(0, 3).map((s) => (
            <li
              key={s}
              className="rounded-full bg-rose-wash px-2.5 py-1 text-[0.7rem] font-medium text-prune-deep"
            >
              {s}
            </li>
          ))}
        </ul>

        <Link
          href={`/coach/${coach.id}`}
          className="btn-secondaire mt-6 w-full"
          aria-label={`Voir le profil de ${coach.name}`}
        >
          Voir le profil
          <ArrowUpRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
