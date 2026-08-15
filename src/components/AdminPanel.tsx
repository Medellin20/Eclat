'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Database,
  CreditCard,
  HardDrive,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import type { Coach } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatPrice } from '@/lib/format';
import CoachEditor from '@/components/CoachEditor';
import { Chargement, Erreur } from '@/components/Etats';
import { isPaypalConfigured, normalizePaypalMeProfile } from '@/lib/paypal';

export default function AdminPanel() {
  const { coaches, bookings, purchases, paypalMeProfile, ready, removeCoach, resetDemo, remoteEnabled, updatePaypalMeProfile } = useApp();

  const [connecte, setConnecte] = useState(false);
  const [authPrete, setAuthPrete] = useState(false);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [erreurConnexion, setErreurConnexion] = useState<string | null>(null);
  const [saisiePaypal, setSaisiePaypal] = useState(paypalMeProfile);
  const [paypalEnregistre, setPaypalEnregistre] = useState(false);
  const [erreurPaypal, setErreurPaypal] = useState<string | null>(null);

  useEffect(() => setSaisiePaypal(paypalMeProfile), [paypalMeProfile]);

  const enregistrerPaypal = () => {
    const profile = normalizePaypalMeProfile(saisiePaypal);
    if (!isPaypalConfigured(profile)) {
      setErreurPaypal('Indiquez un identifiant PayPal.Me valide, par exemple monprofil.');
      setPaypalEnregistre(false);
      return;
    }
    updatePaypalMeProfile(profile);
    setSaisiePaypal(profile);
    setErreurPaypal(null);
    setPaypalEnregistre(true);
  };

  const [editeur, setEditeur] = useState<{ ouvert: boolean; coach: Coach | null }>({
    ouvert: false,
    coach: null,
  });
  const [aSupprimer, setASupprimer] = useState<Coach | null>(null);

  const supprimerProfil = async (coach: Coach) => {
    const urls = new Set([coach.mainPhoto, ...coach.media.flatMap((media) => [media.url, media.poster ?? ''])].filter(Boolean));
    await Promise.all([...urls].map((url) => fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })));
    removeCoach(coach.id);
    setASupprimer(null);
  };

  const reinitialiserPlateforme = async () => {
    const urls = new Set(coaches.flatMap((coach) => [
      coach.mainPhoto,
      ...coach.media.flatMap((media) => [media.url, media.poster ?? '']),
    ]).filter(Boolean));
    await Promise.all([...urls].map((url) => fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })));
    resetDemo();
  };

  useEffect(() => {
    void fetch('/api/admin/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => setConnecte(Boolean(data.authenticated)))
      .finally(() => setAuthPrete(true));
  }, []);

  if (!ready || !authPrete) return <Chargement label="Chargement de l’administration" />;

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
            onSubmit={async (e) => {
              e.preventDefault();
              setConnexionEnCours(true);
              const response = await fetch('/api/admin/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: saisie }),
              });
              const data = (await response.json().catch(() => ({}))) as { error?: string };
              if (response.ok) {
                setConnecte(true);
                setSaisie('');
                setErreurConnexion(null);
              } else {
                setErreurConnexion(data.error ?? 'Connexion impossible. Réessayez.');
              }
              setConnexionEnCours(false);
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
              aria-describedby={erreurConnexion ? 'err-connexion' : undefined}
            />

            {erreurConnexion && (
              <div id="err-connexion" className="mt-3">
                <Erreur message={erreurConnexion} />
              </div>
            )}

            <button type="submit" className="btn-primaire mt-5 w-full" disabled={connexionEnCours}>
              {connexionEnCours ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
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
        <button type="button" onClick={() => { void fetch('/api/admin/session', { method: 'DELETE' }); setConnecte(false); }} className="btn-secondaire">
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

      <section aria-labelledby="titre-paypal-admin" className="mt-10 surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-wash text-prune">
            <CreditCard size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 id="titre-paypal-admin" className="font-display text-2xl text-encre">PayPal.Me</h2>
            <p className="mt-1 text-sm leading-relaxed text-ardoise">Ajoutez ou modifiez le profil utilisé pour recevoir les paiements des photos.</p>
          </div>
        </div>
        <form className="mt-6" onSubmit={(event) => { event.preventDefault(); enregistrerPaypal(); }}>
          <label htmlFor="paypal-me-profile" className="etiquette">Identifiant ou lien PayPal.Me</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="paypal-me-profile"
              type="text"
              value={saisiePaypal}
              onChange={(event) => { setSaisiePaypal(event.target.value); setPaypalEnregistre(false); setErreurPaypal(null); }}
              placeholder="monprofil ou https://paypal.me/monprofil"
              className="champ flex-1"
              autoComplete="off"
            />
            <button type="submit" className="btn-primaire shrink-0">
              <Save size={15} aria-hidden="true" />
              Enregistrer
            </button>
          </div>
          {erreurPaypal && <p role="alert" className="mt-3 text-sm text-rose">{erreurPaypal}</p>}
          {paypalEnregistre && <p role="status" className="mt-3 text-sm text-prune">Profil PayPal.Me enregistré : paypal.me/{saisiePaypal}</p>}
          {!remoteEnabled && <p className="mt-3 text-xs leading-relaxed text-ardoise">Sans Supabase, ce réglage est conservé uniquement dans ce navigateur.</p>}
        </form>
      </section>

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
          Données de la plateforme
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ardoise">
          Efface tous les profils, réservations et déblocages enregistrés.
        </p>
        <button type="button" onClick={() => void reinitialiserPlateforme()} className="btn-secondaire mt-5">
          <RotateCcw size={15} aria-hidden="true" />
          Tout réinitialiser
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
                onClick={() => void supprimerProfil(aSupprimer)}
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
