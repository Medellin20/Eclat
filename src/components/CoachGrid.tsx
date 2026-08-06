'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import CoachCard from '@/components/CoachCard';
import { Chargement, Vide, Erreur } from '@/components/Etats';

export default function CoachGrid() {
  const { coaches, ready, error } = useApp();
  const [requete, setRequete] = useState('');

  const resultats = useMemo(() => {
    const q = requete.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter((c) =>
      [c.name, c.location, c.headline, ...c.specialties]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [coaches, requete]);

  if (!ready) return <Chargement label="Chargement des profils" />;

  return (
    <>
      {error && (
        <div className="mb-8">
          <Erreur message={error} />
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Notre praticien</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-encre sm:text-4xl">
            Découvrez votre praticien dédié
          </h2>
        </div>

        <div className="relative w-full sm:w-72">
          <label htmlFor="recherche" className="sr-only">
            Rechercher un praticien, une ville ou une spécialité
          </label>
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ardoise"
            aria-hidden="true"
          />
          <input
            id="recherche"
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Yoga, Lyon, sommeil…"
            className="champ pl-11"
          />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {resultats.length} profil{resultats.length > 1 ? 's' : ''} affiché
        {resultats.length > 1 ? 's' : ''}
      </p>

      {resultats.length === 0 ? (
        <Vide
          icone={<UserPlus size={22} aria-hidden="true" />}
          titre="Aucun profil ne correspond"
          texte="Essayez un autre mot-clé, ou ajoutez un praticien depuis l'espace d'administration."
          action={
            requete ? (
              <button type="button" onClick={() => setRequete('')} className="btn-secondaire">
                Effacer la recherche
              </button>
            ) : (
              <Link href="/admin" className="btn-primaire">
                Ouvrir l&apos;administration
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {resultats.map((coach, i) => (
            <div key={coach.id} className="animate-montee" style={{ animationDelay: `${i * 70}ms` }}>
              <CoachCard coach={coach} priority={i < 3} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
