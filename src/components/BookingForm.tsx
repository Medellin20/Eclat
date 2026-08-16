'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { CalendarCheck, Check, Clock, ArrowRight, UserPlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SESSION_LABELS, type BookingDraft, type SessionType } from '@/types';
import { formatDate, formatDuration, formatPrice, today } from '@/lib/format';
import { Chargement, Vide, Erreur } from '@/components/Etats';
import BookingPaypal from '@/components/BookingPaypal';

const DUREES = [1, 1.5, 2, 3];
const FRAIS_DEPLACEMENT = 20;

type Erreurs = Partial<Record<keyof BookingDraft, string>>;

export default function BookingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { coaches, ready, addBooking } = useApp();

  const [draft, setDraft] = useState<BookingDraft>({
    coachId: params.get('coach') ?? '',
    date: '',
    time: '',
    durationHours: 1,
    sessionType: 'visio',
    clientName: '',
    phone: '',
    message: '',
  });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [paiementPret, setPaiementPret] = useState(false);
  const [confirmee, setConfirmee] = useState<string | null>(null);

  const coach = useMemo(
    () => coaches.find((c) => c.id === draft.coachId),
    [coaches, draft.coachId],
  );

  const sousTotal = coach ? coach.hourlyRate * draft.durationHours : 0;
  const deplacement = coach && draft.sessionType === 'domicile' ? FRAIS_DEPLACEMENT : 0;
  const total = sousTotal + deplacement;

  const set = <K extends keyof BookingDraft>(cle: K, valeur: BookingDraft[K]) => {
    setDraft((d) => ({ ...d, [cle]: valeur }));
    setErreurs((e) => ({ ...e, [cle]: undefined }));
    setPaiementPret(false);
  };

  const valider = (): Erreurs => {
    const e: Erreurs = {};
    if (!draft.coachId) e.coachId = 'Choisissez un praticien.';
    if (!draft.date) e.date = 'Indiquez une date.';
    else if (draft.date < today()) e.date = 'La date doit être aujourd’hui ou plus tard.';
    if (!draft.time) e.time = 'Indiquez une heure.';
    if (draft.clientName.trim().length < 2) e.clientName = 'Indiquez votre nom complet.';
    if (!/^[+0-9][0-9 ().-]{7,19}$/.test(draft.phone.trim()))
      e.phone = 'Numéro invalide. Exemple : 06 12 34 56 78.';
    return e;
  };

  const soumettre = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const e = valider();
    setErreurs(e);
    if (Object.keys(e).length > 0 || !coach) {
      const premier = Object.keys(e)[0];
      if (premier) document.getElementById(premier)?.focus();
      return;
    }

    setPaiementPret(true);
  };

  const confirmerApresPaiement = useCallback(async (paypalReference: string) => {
    if (!coach) return;
    const booking = await addBooking({
      coachId: coach.id,
      coachName: coach.name,
      coachPhoto: coach.mainPhoto,
      date: draft.date,
      time: draft.time,
      durationHours: draft.durationHours,
      sessionType: draft.sessionType,
      clientName: draft.clientName.trim(),
      phone: draft.phone.trim(),
      message: draft.message.trim() || undefined,
      total,
      status: 'confirmee',
      paypalReference,
    });

    setConfirmee(booking.id);
  }, [addBooking, coach, draft, total]);

  if (!ready) return <Chargement label="Chargement du formulaire" />;

  if (coaches.length === 0) {
    return (
      <Vide
        icone={<UserPlus size={22} aria-hidden="true" />}
        titre="Aucun praticien disponible"
        texte="Ajoutez au moins un profil depuis l'espace d'administration pour pouvoir réserver."
        action={
          <Link href="/admin" className="btn-primaire">
            Ouvrir l&apos;administration
          </Link>
        }
      />
    );
  }

  if (confirmee) {
    return (
      <div className="surface aura mx-auto max-w-xl px-8 py-14 text-center animate-montee">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-prune shadow-douce">
          <Check size={30} strokeWidth={2.4} aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-display text-3xl leading-tight text-encre">
          Paiement confirmé
        </h2>
        <p aria-live="polite" className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ardoise">
          Votre appel avec {coach?.name} est payé et confirmé. Vous pouvez ouvrir
          la salle depuis « Mes séances ».
        </p>

        <dl className="mx-auto mt-8 max-w-sm space-y-3 rounded-3xl border border-brume bg-white p-6 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ardoise">Date</dt>
            <dd className="text-right font-medium text-encre">{formatDate(draft.date)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ardoise">Heure</dt>
            <dd className="tabulaire font-medium text-encre">{draft.time}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ardoise">Total</dt>
            <dd className="tabulaire font-semibold text-prune-deep">{formatPrice(total)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push('/bookings-history')} className="btn-primaire">
            Voir mes séances
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmee(null);
              setDraft((d) => ({ ...d, date: '', time: '', message: '' }));
            }}
            className="btn-secondaire"
          >
            Réserver à nouveau
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} noValidate className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
      {/* ---- Champs ---- */}
      <div className="surface p-7 sm:p-9">
        <fieldset className="border-0 p-0">
          <legend className="sr-only">Détails de la séance</legend>

          <div>
            <label htmlFor="coachId" className="etiquette">
              Praticien
            </label>
            <select
              id="coachId"
              value={draft.coachId}
              onChange={(e) => set('coachId', e.target.value)}
              className="champ"
              aria-invalid={Boolean(erreurs.coachId)}
              aria-describedby={erreurs.coachId ? 'err-coachId' : undefined}
            >
              <option value="">Choisir un praticien…</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.headline} ({formatPrice(c.hourlyRate)}/h)
                </option>
              ))}
            </select>
            {erreurs.coachId && (
              <div id="err-coachId" className="mt-2">
                <Erreur message={erreurs.coachId} />
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="etiquette">
                Date
              </label>
              <input
                id="date"
                type="date"
                min={today()}
                value={draft.date}
                onChange={(e) => set('date', e.target.value)}
                className="champ"
                aria-invalid={Boolean(erreurs.date)}
                aria-describedby={erreurs.date ? 'err-date' : undefined}
              />
              {erreurs.date && (
                <div id="err-date" className="mt-2">
                  <Erreur message={erreurs.date} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="time" className="etiquette">
                Heure
              </label>
              <input
                id="time"
                type="time"
                step={900}
                value={draft.time}
                onChange={(e) => set('time', e.target.value)}
                className="champ"
                aria-invalid={Boolean(erreurs.time)}
                aria-describedby={erreurs.time ? 'err-time' : undefined}
              />
              {erreurs.time && (
                <div id="err-time" className="mt-2">
                  <Erreur message={erreurs.time} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <span className="etiquette">Durée</span>
            <div role="radiogroup" aria-label="Durée de la séance" className="flex flex-wrap gap-2">
              {DUREES.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={draft.durationHours === h}
                  onClick={() => set('durationHours', h)}
                  className={`tabulaire rounded-2xl border px-5 py-2.5 text-sm font-medium transition-all ${
                    draft.durationHours === h
                      ? 'border-prune bg-prune text-white shadow-douce'
                      : 'border-brume bg-white text-ardoise hover:border-prune-soft'
                  }`}
                >
                  {formatDuration(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <span className="etiquette">Type de rendez-vous</span>
            <div role="radiogroup" aria-label="Type de rendez-vous" className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(SESSION_LABELS) as SessionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={draft.sessionType === t}
                  onClick={() => set('sessionType', t)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    draft.sessionType === t
                      ? 'border-prune bg-rose-wash text-prune-deep'
                      : 'border-brume bg-white text-ardoise hover:border-prune-soft'
                  }`}
                >
                  {SESSION_LABELS[t]}
                  {t === 'domicile' && (
                    <span className="mt-0.5 block text-[0.68rem] font-normal text-ardoise">
                      + {formatPrice(FRAIS_DEPLACEMENT)} de déplacement
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="mt-8 border-0 p-0">
          <legend className="etiquette !mb-4">Vos coordonnées</legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="clientName" className="etiquette">
                Nom complet
              </label>
              <input
                id="clientName"
                type="text"
                autoComplete="name"
                value={draft.clientName}
                onChange={(e) => set('clientName', e.target.value)}
                placeholder="Marie Delaunay"
                className="champ"
                aria-invalid={Boolean(erreurs.clientName)}
                aria-describedby={erreurs.clientName ? 'err-clientName' : undefined}
              />
              {erreurs.clientName && (
                <div id="err-clientName" className="mt-2">
                  <Erreur message={erreurs.clientName} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="etiquette">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={draft.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="champ"
                aria-invalid={Boolean(erreurs.phone)}
                aria-describedby={erreurs.phone ? 'err-phone' : undefined}
              />
              {erreurs.phone && (
                <div id="err-phone" className="mt-2">
                  <Erreur message={erreurs.phone} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="message" className="etiquette">
              Message <span className="font-normal normal-case tracking-normal">(facultatif)</span>
            </label>
            <textarea
              id="message"
              rows={4}
              value={draft.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder="Ce que vous souhaitez travailler, une blessure à signaler, vos contraintes d’horaires…"
              className="champ resize-y"
            />
          </div>
        </fieldset>
      </div>

      {/* ---- Récapitulatif ---- */}
      <aside aria-label="Récapitulatif" className="lg:sticky lg:top-24 lg:h-fit">
        <div className="surface overflow-hidden">
          {coach ? (
            <div className="flex items-center gap-4 border-b border-brume p-6">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                <Image src={coach.mainPhoto} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight text-encre">{coach.name}</p>
                <p className="truncate text-xs text-ardoise">{coach.location}</p>
              </div>
            </div>
          ) : (
            <div className="border-b border-brume p-6">
              <p className="text-sm text-ardoise">
                Sélectionnez un praticien pour voir le détail du prix.
              </p>
            </div>
          )}

          <div className="p-6">
            <p className="eyebrow">Récapitulatif</p>

            <dl className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-ardoise">
                  <CalendarCheck size={14} aria-hidden="true" />
                  Date
                </dt>
                <dd className="text-right font-medium text-encre">
                  {draft.date ? formatDate(draft.date) : '—'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-ardoise">
                  <Clock size={14} aria-hidden="true" />
                  Heure et durée
                </dt>
                <dd className="tabulaire text-right font-medium text-encre">
                  {draft.time || '—'} · {formatDuration(draft.durationHours)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ardoise">Format</dt>
                <dd className="text-right font-medium text-encre">
                  {SESSION_LABELS[draft.sessionType]}
                </dd>
              </div>
            </dl>

            <div className="mt-6 space-y-2.5 border-t border-brume pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ardoise">
                  {coach ? `${formatPrice(coach.hourlyRate)} × ${formatDuration(draft.durationHours)}` : 'Séance'}
                </span>
                <span className="tabulaire text-encre">{formatPrice(sousTotal)}</span>
              </div>
              {deplacement > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-ardoise">Déplacement</span>
                  <span className="tabulaire text-encre">{formatPrice(deplacement)}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-brume pt-5">
              <span className="font-display text-lg text-encre">Total</span>
              <span
                className="tabulaire font-display text-3xl text-prune-deep"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatPrice(total)}
              </span>
            </div>

            <button type="submit" className="btn-primaire mt-7 w-full">
              Continuer vers le paiement
            </button>

            {paiementPret && coach && (
              <BookingPaypal
                coachId={coach.id}
                durationHours={draft.durationHours}
                sessionType={draft.sessionType}
                total={total}
                onApproved={confirmerApresPaiement}
              />
            )}

            <p className="mt-4 text-center text-xs leading-relaxed text-ardoise">
              La réservation n’est enregistrée qu’après confirmation du paiement.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
