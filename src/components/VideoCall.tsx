'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock, Mic, MicOff, PhoneOff, Video, VideoOff, UserSearch } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatTimer } from '@/lib/format';
import { Chargement, Vide } from '@/components/Etats';

type Etat = 'connexion' | 'en_cours' | 'termine';

export default function VideoCall() {
  const router = useRouter();
  const params = useSearchParams();
  const { getCoach, bookings, ready } = useApp();

  const bookingId = params.get('booking') ?? '';
  const paidBooking = bookings.find((booking) =>
    booking.id === bookingId
    && booking.sessionType === 'visio'
    && booking.status === 'confirmee'
    && Boolean(booking.paypalReference),
  );
  const coachId = paidBooking?.coachId ?? '';
  const coach = getCoach(coachId);

  const [etat, setEtat] = useState<Etat>('connexion');
  const [secondes, setSecondes] = useState(0);
  const [micro, setMicro] = useState(true);
  const [camera, setCamera] = useState(true);

  // Connexion simulée : aucun service externe n'est contacté.
  useEffect(() => {
    if (!coach) return;
    const t = window.setTimeout(() => setEtat('en_cours'), 1600);
    return () => window.clearTimeout(t);
  }, [coach]);

  // Minuteur.
  useEffect(() => {
    if (etat !== 'en_cours') return;
    const i = window.setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [etat]);

  // Échap raccroche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && etat === 'en_cours') setEtat('termine');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [etat]);

  if (!ready) return <Chargement label="Ouverture de la salle" />;

  if (!paidBooking) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 sm:px-8">
        <Vide
          icone={<Lock size={22} aria-hidden="true" />}
          titre="Appel vidéo verrouillé"
          texte="Le paiement PayPal doit être confirmé avant de pouvoir entrer dans la salle d’appel."
          action={<Link href="/bookings" className="btn-primaire">Réserver et payer</Link>}
        />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 sm:px-8">
        <Vide
          icone={<UserSearch size={22} aria-hidden="true" />}
          titre="Salle introuvable"
          texte="Le praticien associé à cet appel n’existe plus. Ouvrez un profil pour relancer un appel."
          action={
            <Link href="/" className="btn-primaire">
              Retour aux profils
            </Link>
          }
        />
      </div>
    );
  }

  if (etat === 'termine') {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 sm:px-8">
        <div className="surface px-8 py-14 text-center animate-montee">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brume text-ardoise">
            <PhoneOff size={22} aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-display text-3xl leading-tight text-encre">Appel terminé</h1>
          <p className="mt-3 text-sm leading-relaxed text-ardoise">
            {formatTimer(secondes)} avec {coach.name}. Rien n’a été enregistré.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/coach/${coach.id}`} className="btn-primaire">
              Revenir au profil
            </Link>
            <Link href={`/bookings?coach=${coach.id}`} className="btn-secondaire">
              Réserver une séance
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <section
        aria-label={`Appel vidéo avec ${coach.name}`}
        className="relative overflow-hidden rounded-5xl bg-encre shadow-levee"
      >
        {/* Flux distant simulé */}
        <div className="relative aspect-[4/5] w-full sm:aspect-video">
          <Image
            src={coach.mainPhoto}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-all duration-700 ${
              etat === 'connexion' ? 'scale-105 blur-2xl brightness-50' : 'brightness-[0.82]'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-encre/85 via-transparent to-encre/45" />

          {/* Bandeau haut */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-7">
            <div>
              <p className="font-display text-2xl leading-tight text-white sm:text-3xl">
                {coach.name}
              </p>
              <p className="mt-1 text-sm text-white/70">{coach.headline}</p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 backdrop-blur">
              <span
                className={`h-2 w-2 rounded-full ${
                  etat === 'en_cours' ? 'animate-pulse bg-emerald-400' : 'bg-amber-300'
                }`}
                aria-hidden="true"
              />
              <span className="tabulaire text-sm font-semibold text-white" aria-live="off">
                {etat === 'en_cours' ? formatTimer(secondes) : 'Connexion…'}
              </span>
            </div>
          </div>

          <p aria-live="polite" className="sr-only">
            {etat === 'en_cours' ? `Appel en cours avec ${coach.name}` : 'Connexion en cours'}
          </p>

          {/* Retour caméra local */}
          <div className="absolute bottom-28 right-5 h-28 w-20 overflow-hidden rounded-2xl border-2 border-white/25 bg-prune-deep sm:bottom-32 sm:right-7 sm:h-32 sm:w-24">
            {camera ? (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-prune via-prune-soft to-rose">
                <span className="text-xs font-semibold text-white/90">Vous</span>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center bg-encre">
                <VideoOff size={18} className="text-white/50" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Commandes */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-5 sm:gap-4 sm:p-7">
            <button
              type="button"
              onClick={() => setMicro((v) => !v)}
              aria-pressed={!micro}
              aria-label={micro ? 'Couper le micro' : 'Réactiver le micro'}
              className={`grid h-14 w-14 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-105 ${
                micro ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-encre'
              }`}
            >
              {micro ? <Mic size={20} aria-hidden="true" /> : <MicOff size={20} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => setCamera((v) => !v)}
              aria-pressed={!camera}
              aria-label={camera ? 'Couper la caméra' : 'Réactiver la caméra'}
              className={`grid h-14 w-14 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-105 ${
                camera ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-encre'
              }`}
            >
              {camera ? <Video size={20} aria-hidden="true" /> : <VideoOff size={20} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => setEtat('termine')}
              aria-label="Raccrocher"
              className="grid h-14 w-20 place-items-center rounded-full bg-rose text-white shadow-levee transition-all duration-300 hover:scale-105 hover:bg-[#c9356e]"
            >
              <PhoneOff size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-xs leading-relaxed text-ardoise">
          Interface de démonstration : aucune caméra ni aucun micro n’est activé, aucun
          service de visioconférence externe n’est appelé, rien n’est enregistré.
        </p>
        <button type="button" onClick={() => router.push(`/coach/${coach.id}`)} className="btn-fantome text-sm">
          Quitter la salle
        </button>
      </div>
    </div>
  );
}
