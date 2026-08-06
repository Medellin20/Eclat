'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Database,
  HardDrive,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { Coach } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatPrice } from '@/lib/format';
import CoachEditor from '@/components/CoachEditor';
import { Chargement, Erreur } from '@/components/Etats';

/**
 * ⚠️ AUTHENTIFICATION DE DÉMONSTRATION UNIQUEMENT
 *
 * Ce mot de passe est en clair côté client : n'importe qui peut le lire
 * dans le bundle JavaScript. Il n'offre AUCUNE sécurité réelle.
 *
 * En production, remplacez tout ce bloc par Supabase Auth :
 *   1. `supabase.auth.signInWithPassword({ email, password })`
 *   2. Protégez les routes via un middleware Next.js qui vérifie la session.
 *   3. Activez Row Level Security (RLS) sur la table `app_state` et
 *      n'autorisez l'écriture qu'aux comptes portant le rôle « admin ».
 *
 * Sans RLS, la clé anonyme publique permet à quiconque d'écrire dans la base.
 */
const MOT_DE_PASSE_DEMO = 'eclat2026';

export default function AdminPanel() {
  const { coaches, bookings, purchases, ready, removeCoach, resetDemo, remoteEnabled } = useApp();

  const [connecte, setConnecte] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [erreurConnexion, setErreurConnexion] = useState<string | null>(null);

  const [editeur, setEditeur] = useState<{ ouvert: boolean; coach: Coach | null }>({
    ouvert: false,
    coach: null,
  });
  const [aSupprimer, setASupprimer] = useState<Coach | null>(null);

  if (!ready) return <Chargement label="Chargement de l’administration" />;

  // ---------- Écran de connexion ----------
  if (!connecte) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16 sm:px-8">
        <div className="surface aura w-full px-8 py-10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-prune shadow-douce">
            <KeyRound size={20} aria-hidden="true" />
          </div>

          <h1 className="mt-6 font-display text-3xl leading-tight text-encre">Administration</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ardoise">
            Espace de gestion des profils, des tarifs et des médias.
          </p>

          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (saisie === MOT_DE_PASSE_DEMO) {
                setConnecte(true);
                setErreurConnexion(null);
              } else {
                setErreurConnexion('Mot de passe incorrect. Réessayez.');
              }
            }}
          >
            <label htmlFor="motdepasse" className="etiquette">
              Mot de passe
            </label>
            <input
              id="motdepasse"
              type="password"
              autoComplete="current-password"
              value={saisie}
              onChange={(e) => {
                setSaisie(e.target.value);
                setErreurConnexion(null);
              }}
              className="champ"
              aria-invalid={Boolean(erreurConnexion)}
              aria-describedby={erreurConnexion ? 'err-connexion' : 'aide-connexion'}
            />

            {erreurConnexion && (
              <div id="err-connexion" className="mt-3">
                <Erreur message={erreurConnexion} />
              </div>
            )}

            <button type="submit" className="btn-primaire mt-5 w-full">
              Se connecter
            </button>
          </form>

          <div id="aide-connexion" className="mt-7 flex gap-3 rounded-3xl bg-white/70 p-4">
            <ShieldAlert size={17} className="mt-0.5 shrink-0 text-prune" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ardoise">
              Démonstration : le mot de passe est{' '}
              <code className="rounded bg-brume px-1.5 py-0.5 font-semibold text-encre">
                {MOT_DE_PASSE_DEMO}
              </code>
              . Il est écrit en clair dans le code et n’offre aucune sécurité. En
              production, utilisez Supabase Auth avec Row Level Security.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Tableau de bord ----------
  return (
    <div className="mx-auto max-w-5xl px-5 pb-8 pt-14 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.06] tracking-tight text-encre sm:text-5xl">
            Tableau de bord
          </h1>
        </div>
        <button type="button" onClick={() => setConnecte(false)} className="btn-secondaire">
          <LogOut size={15} aria-hidden="true" />
          Se déconnecter
        </button>
      </header>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { l: 'Profils', v: coaches.length },
          { l: 'Réservations', v: bookings.length },
          { l: 'Déblocages simulés', v: purchases.length },
        ].map((s) => (
          <div key={s.l} className="surface p-6">
            <dt className="text-xs uppercase tracking-[0.14em] text-ardoise">{s.l}</dt>
            <dd className="tabulaire mt-2 font-display text-4xl text-encre">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-center gap-3 rounded-3xl border border-brume bg-white px-5 py-4">
        {remoteEnabled ? (
          <Database size={17} className="shrink-0 text-prune" aria-hidden="true" />
        ) : (
          <HardDrive size={17} className="shrink-0 text-ardoise" aria-hidden="true" />
        )}
        <p className="text-sm text-ardoise">
          {remoteEnabled
            ? 'Supabase est configuré : les données sont synchronisées avec la table app_state.'
            : 'Supabase n’est pas configuré : les données sont conservées dans le localStorage de ce navigateur.'}
        </p>
      </div>

      <section aria-labelledby="titre-profils-admin" className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="titre-profils-admin" className="font-display text-2xl text-encre">
            Profils
          </h2>
          <button
            type="button"
            onClick={() => setEditeur({ ouvert: true, coach: null })}
            className="btn-primaire"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
            Ajouter un profil
          </button>
        </div>

        {coaches.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-brume p-10 text-center text-sm text-ardoise">
            Aucun profil. Ajoutez-en un pour qu’il apparaisse sur la page d’accueil.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {coaches.map((c) => (
              <li key={c.id} className="surface flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brume">
                  <Image src={c.mainPhoto} alt="" fill sizes="64px" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/coach/${c.id}`}
                    className="font-display text-lg leading-tight text-encre underline-offset-4 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-sm text-ardoise">{c.headline}</p>
                  <p className="tabulaire mt-0.5 text-xs text-ardoise">
                    {formatPrice(c.hourlyRate)}/h · {c.location} · {c.media.length} média
                    {c.media.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="ml-auto flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditeur({ ouvert: true, coach: c })}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-brume text-ardoise transition-colors hover:border-prune-soft hover:text-prune"
                    aria-label={`Modifier ${c.name}`}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setASupprimer(c)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-brume text-ardoise transition-colors hover:border-rose-soft hover:text-rose"
                    aria-label={`Supprimer ${c.name}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-donnees" className="mt-14 border-t border-brume pt-8">
        <h2 id="titre-donnees" className="font-display text-xl text-encre">
          Données de démonstration
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ardoise">
          Rétablit le profil d’origine et efface les réservations et
          déblocages enregistrés dans ce navigateur.
        </p>
        <button type="button" onClick={resetDemo} className="btn-secondaire mt-5">
          <RotateCcw size={15} aria-hidden="true" />
          Réinitialiser la démonstration
        </button>
      </section>

      {editeur.ouvert && (
        <CoachEditor
          coach={editeur.coach}
          onClose={() => setEditeur({ ouvert: false, coach: null })}
        />
      )}

      {aSupprimer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-suppression"
          className="fixed inset-0 z-[105] grid place-items-center bg-encre/60 px-4 backdrop-blur-sm"
          onClick={() => setASupprimer(null)}
        >
          <div
            className="w-full max-w-sm rounded-4xl bg-white p-8 shadow-levee animate-montee"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="titre-suppression" className="font-display text-2xl leading-tight text-encre">
              Supprimer {aSupprimer.name} ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ardoise">
              Le profil, ses médias et ses réservations seront retirés. Cette action
              est définitive.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  removeCoach(aSupprimer.id);
                  setASupprimer(null);
                }}
                className="btn flex-1 bg-rose text-white hover:bg-[#c9356e]"
              >
                Supprimer
              </button>
              <button type="button" onClick={() => setASupprimer(null)} className="btn-secondaire flex-1">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
