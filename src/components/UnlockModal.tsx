'use client';

import { FormEvent, useState } from 'react';
import { X, ShieldCheck, Check, Loader2, Lock, ExternalLink } from 'lucide-react';
import type { Media } from '@/types';
import { isPaypalConfigured, paypalMeUrl } from '@/lib/paypal';
import AlternativePayments from '@/components/AlternativePayments';

interface Props {
  media: Media;
  coachName: string;
  paypalMeProfile: string;
  photoNumber?: number;
  onClose: () => void;
}

type Etape = 'coordonnees' | 'paiement' | 'traitement' | 'succes';

export default function UnlockModal({ media, coachName, paypalMeProfile, photoNumber, onClose }: Props) {
  const [etape, setEtape] = useState<Etape>('coordonnees');
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const continuer = (event: FormEvent) => {
    event.preventDefault();
    setErreur(null);
    if (!isPaypalConfigured(paypalMeProfile)) {
      setErreur('Le lien PayPal.Me doit être configuré avant de pouvoir commander cette photo.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur('Saisissez une adresse e-mail valide.');
      return;
    }
    setEtape('paiement');
  };

  const signalerPaiement = async () => {
    setEtape('traitement');
    setErreur(null);
    try {
      const response = await fetch('/api/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          mediaTitle: media.title,
          coachName,
          amount: media.price,
          customerEmail: email.trim(),
          photoNumber,
        }),
      });
      const data = await response.json() as { delivered?: boolean };
      if (!response.ok || !data.delivered) throw new Error();
      setEtape('succes');
    } catch {
      setEtape('paiement');
      setErreur('La demande n’a pas pu être envoyée. Réessayez dans un instant.');
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titre-deblocage" className="fixed inset-0 z-[110] grid place-items-center bg-encre/60 px-4 backdrop-blur-sm animate-apparition" onClick={() => etape !== 'traitement' && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-levee animate-montee" onClick={(e) => e.stopPropagation()}>
        <div className="aura relative border-b border-brume px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">Photo Fantasme</p><h2 id="titre-deblocage" className="mt-1.5 font-display text-2xl leading-tight text-encre">Recevoir la photo en privé</h2></div>
            <button type="button" onClick={onClose} disabled={etape === 'traitement'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ardoise hover:bg-white/70 hover:text-encre disabled:opacity-40" aria-label="Fermer"><X size={17} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="px-7 py-6">
          {etape === 'succes' ? (
            <div className="py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-wash text-prune"><Check size={26} aria-hidden="true" /></div>
              <p className="mt-5 font-display text-xl text-encre">Demande bien reçue</p>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">Après réception et vérification des fonds, la photo Fantasme sera envoyée directement à <strong>{email}</strong> pour plus de confidentialité.</p>
              <button type="button" onClick={onClose} className="btn-primaire mt-6 w-full">Fermer</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-3xl border border-brume bg-porcelaine p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-prune shadow-douce"><Lock size={17} aria-hidden="true" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-encre">{photoNumber ? `Photo n°${photoNumber} · ` : ''}{media.title}</p><p className="text-xs text-ardoise">Envoi confidentiel par e-mail · {coachName}</p></div>
                <p className="tabulaire ml-auto shrink-0 text-lg font-semibold text-prune-deep">{media.price.toFixed(2)} €</p>
              </div>

              <div className="mt-5 flex gap-3 rounded-3xl bg-rose-wash p-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-prune" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-prune-deep">Après réception des fonds, la photo Fantasme vous sera envoyée directement par e-mail pour plus de confidentialité.</p>
              </div>

              {etape === 'coordonnees' ? (
                <form onSubmit={continuer} className="mt-5">
                  <label htmlFor="email-photo" className="text-sm font-medium text-encre">E-mail de réception</label>
                  <input id="email-photo" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="mt-2 w-full rounded-2xl border border-brume bg-white px-4 py-3 text-sm text-encre outline-none transition focus:border-prune" />
                  <button type="submit" className="btn-primaire mt-5 w-full">Continuer vers le paiement</button>
                </form>
              ) : etape === 'traitement' ? (
                <div className="mt-6 flex items-center justify-center gap-2 py-3 text-sm text-prune"><Loader2 size={17} className="animate-spin" />Envoi de votre demande…</div>
              ) : (
                <div className="mt-5">
                  <div className="rounded-2xl border border-brume p-4 text-sm leading-relaxed text-encre">
                    Sur PayPal, choisissez obligatoirement l’option <strong>« Amis et proches »</strong> avant de valider l’envoi.
                  </div>
                  <a href={paypalMeUrl(paypalMeProfile, media.price)} target="_blank" rel="noopener noreferrer" className="btn-primaire mt-4 flex w-full items-center justify-center gap-2">Payer {media.price.toFixed(2)} € sur PayPal.Me <ExternalLink size={16} aria-hidden="true" /></a>
                  <AlternativePayments />
                  <button type="button" onClick={signalerPaiement} className="btn-secondaire mt-3 w-full">J’ai effectué le paiement</button>
                  <button type="button" onClick={() => setEtape('coordonnees')} className="btn-fantome mt-2 w-full">Modifier mon e-mail</button>
                </div>
              )}
              {erreur && <p role="alert" className="mt-3 text-center text-sm text-rose">{erreur}</p>}
              <button type="button" onClick={onClose} disabled={etape === 'traitement'} className="btn-fantome mt-2 w-full">Annuler</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
