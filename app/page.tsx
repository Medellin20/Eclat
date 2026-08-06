import Link from 'next/link';
import { ArrowRight, CalendarCheck, Video } from 'lucide-react';
import CoachGrid from '@/components/CoachGrid';

const ETAPES = [
  {
    titre: 'Choisissez un praticien',
    texte:
      "Chaque profil détaille la méthode, le tarif horaire et les séances déjà réalisées. Les extraits vidéo sont libres d'accès.",
  },
  {
    titre: 'Réservez un créneau',
    texte:
      'Date, heure, durée et format — le récapitulatif se met à jour avant le règlement sécurisé via PayPal.',
  },
  {
    titre: 'Retrouvez-vous en séance',
    texte:
      "En visio, en studio ou à domicile. La salle d'appel est accessible depuis le profil, dix minutes avant l'heure.",
  },
];

const ATOUTS = [
  { icone: CalendarCheck, titre: 'Créneaux confirmés en 24 h', texte: 'Réponse du praticien sous un jour ouvré.' },
  { icone: Video, titre: 'Séances en visio incluses', texte: 'Salle intégrée, rien à installer.' },
];

export default function AccueilPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="aura relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-soft/20 blur-3xl" aria-hidden="true" />
          <div className="relative animate-montee">
            <p className="eyebrow">Coaching &amp; bien-être · France</p>

            <h1 className="mx-auto mt-5 max-w-4xl font-display text-[2.75rem] leading-[1.04] tracking-tight text-encre sm:text-6xl lg:text-7xl">
              Une heure avec quelqu&apos;un qui sait
              <span className="texte-degrade"> exactement </span>
              quoi vous faire travailler.
            </h1>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/bookings" className="btn-primaire">
                Réserver une séance
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <a href="#profils" className="btn-secondaire">
                Voir le profil
              </a>
            </div>

            <dl className="mx-auto mt-14 flex max-w-2xl flex-wrap justify-center gap-x-12 gap-y-5 border-t border-brume pt-7">
              {[
                { v: '1', l: 'praticien' },
                { v: '4,9', l: 'note moyenne' },
                { v: '128', l: 'séances réalisées' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd>
                    <span className="tabulaire block font-display text-3xl text-encre">{s.v}</span>
                    <span className="mt-0.5 block text-xs uppercase tracking-[0.14em] text-ardoise">
                      {s.l}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- Atouts ---------- */}
      <section className="mx-auto max-w-4xl px-5 sm:px-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {ATOUTS.map(({ icone: Icone, titre, texte }) => (
            <li key={titre} className="surface flex items-start gap-4 p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-wash text-prune">
                <Icone size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-encre">{titre}</p>
                <p className="mt-1 text-sm leading-relaxed text-ardoise">{texte}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Déroulé (une vraie séquence : la numérotation porte du sens) ---------- */}
      <section aria-labelledby="titre-deroule" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
        <p className="eyebrow">Déroulé</p>
        <h2 id="titre-deroule" className="mt-2 max-w-xl font-display text-3xl leading-tight text-encre sm:text-4xl">
          Trois étapes, de la recherche à la séance
        </h2>

        <ol className="mt-10 grid gap-px overflow-hidden rounded-4xl border border-brume bg-brume sm:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="bg-white p-8">
              <span className="tabulaire font-display text-4xl text-rose-soft">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-display text-xl text-encre">{e.titre}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ardoise">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Profils ---------- */}
      <section id="profils" aria-labelledby="titre-profils" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 sm:px-8">
        <h2 id="titre-profils" className="sr-only">
          Profil disponible
        </h2>
        <CoachGrid />
      </section>

      {/* ---------- Appel à l'action ---------- */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <div className="aura surface overflow-hidden px-8 py-14 text-center sm:px-16">
          <p className="eyebrow">Prêt à commencer ?</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl leading-tight text-encre sm:text-4xl">
            La première séance sert surtout à comprendre où vous en êtes.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ardoise">
            Pas de programme type : chaque praticien construit à partir de votre situation.
          </p>
          <Link href="/bookings" className="btn-primaire mt-8">
            Choisir un créneau
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
