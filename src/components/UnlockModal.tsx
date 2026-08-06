'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, Check, Loader2, Lock } from 'lucide-react';
import type { Media } from '@/types';

interface Props {
  media: Media;
  coachName: string;
  onClose: () => void;
  onConfirm: (paypalReference: string) => void;
}

interface PaypalButtons {
  render: (element: HTMLElement) => Promise<void>;
  close?: () => void;
}

interface PaypalSdk {
  Buttons: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: () => void;
    style: Record<string, string | number>;
  }) => PaypalButtons;
}

type Etape = 'confirmation' | 'traitement' | 'succes';

export default function UnlockModal({ media, coachName, onClose, onConfirm }: Props) {
  const [etape, setEtape] = useState<Etape>('confirmation');
  const [erreur, setErreur] = useState<string | null>(null);
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && etape !== 'traitement') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, etape]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (etape !== 'confirmation' || !paypalRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setErreur('PayPal Checkout doit être configuré avant de pouvoir acheter ce média.');
      return;
    }

    let buttons: PaypalButtons | undefined;
    let cancelled = false;
    const renderButtons = async () => {
      const paypal = (window as unknown as { paypal?: PaypalSdk }).paypal;
      if (!paypal || !paypalRef.current || cancelled) return;
      paypalRef.current.innerHTML = '';
      buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'pill', label: 'paypal', height: 48 },
        createOrder: async () => {
          setErreur(null);
          const response = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', amount: media.price, mediaId: media.id, mediaTitle: media.title }),
          });
          const data = await response.json() as { id?: string; error?: string };
          if (!response.ok || !data.id) throw new Error(data.error || 'Création du paiement impossible.');
          return data.id;
        },
        onApprove: async ({ orderID }) => {
          setEtape('traitement');
          const response = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'capture', orderId: orderID }),
          });
          const data = await response.json() as {
            completed?: boolean;
            captureId?: string;
            mediaId?: string;
            amount?: number;
            error?: string;
          };
          if (
            !response.ok
            || !data.completed
            || !data.captureId
            || data.mediaId !== media.id
            || data.amount !== media.price
          ) {
            setEtape('confirmation');
            throw new Error(data.error || 'Le paiement n’a pas été confirmé.');
          }
          onConfirm(data.captureId);
          setEtape('succes');
          void fetch('/api/notify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: media.id, mediaTitle: media.title, coachName, amount: media.price }),
          });
        },
        onCancel: () => setErreur('Paiement annulé. Le contenu reste verrouillé.'),
        onError: () => {
          setEtape('confirmation');
          setErreur('Le paiement PayPal n’a pas abouti. Le contenu reste verrouillé.');
        },
      });
      await buttons.render(paypalRef.current);
    };

    const existing = document.getElementById('paypal-checkout-sdk') as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { paypal?: PaypalSdk }).paypal) void renderButtons();
      else existing.addEventListener('load', () => void renderButtons(), { once: true });
    } else {
      const script = document.createElement('script');
      script.id = 'paypal-checkout-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&intent=capture`;
      script.async = true;
      script.onload = () => void renderButtons();
      script.onerror = () => setErreur('Impossible de charger PayPal. Réessayez plus tard.');
      document.head.appendChild(script);
    }
    return () => { cancelled = true; buttons?.close?.(); };
  }, [coachName, etape, media, onConfirm]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titre-deblocage" className="fixed inset-0 z-[110] grid place-items-center bg-encre/60 px-4 backdrop-blur-sm animate-apparition" onClick={() => etape !== 'traitement' && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-levee animate-montee" onClick={(e) => e.stopPropagation()}>
        <div className="aura relative border-b border-brume px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">Contenu premium</p><h2 id="titre-deblocage" className="mt-1.5 font-display text-2xl leading-tight text-encre">Débloquer ce contenu</h2></div>
            <button type="button" onClick={onClose} disabled={etape === 'traitement'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ardoise hover:bg-white/70 hover:text-encre disabled:opacity-40" aria-label="Fermer"><X size={17} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="px-7 py-6">
          {etape === 'succes' ? (
            <div className="py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-wash text-prune"><Check size={26} aria-hidden="true" /></div>
              <p className="mt-5 font-display text-xl text-encre">Paiement confirmé</p>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">« {media.title} » est maintenant accessible.</p>
              <button type="button" onClick={onClose} className="btn-primaire mt-6 w-full">Voir le contenu</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-3xl border border-brume bg-porcelaine p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-prune shadow-douce"><Lock size={17} aria-hidden="true" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-encre">{media.title}</p><p className="text-xs text-ardoise">{media.kind === 'video' ? 'Vidéo' : 'Photo'} · {coachName}</p></div>
                <p className="tabulaire ml-auto shrink-0 text-lg font-semibold text-prune-deep">{media.price.toFixed(2)} €</p>
              </div>
              <div className="mt-5 flex gap-3 rounded-3xl bg-rose-wash p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-prune" aria-hidden="true" /><p className="text-xs leading-relaxed text-prune-deep">Le contenu est débloqué uniquement après confirmation du paiement par PayPal.</p></div>
              {etape === 'traitement' ? <div className="mt-6 flex items-center justify-center gap-2 py-3 text-sm text-prune"><Loader2 size={17} className="animate-spin" />Confirmation du paiement…</div> : <div ref={paypalRef} className="mt-6 min-h-12" />}
              {erreur && <p role="alert" className="mt-3 text-center text-sm text-rose">{erreur}</p>}
              <button type="button" onClick={onClose} disabled={etape === 'traitement'} className="btn-fantome mt-2 w-full">Annuler</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
