'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { SessionType } from '@/types';

interface Props {
  coachId: string;
  durationHours: number;
  sessionType: SessionType;
  total: number;
  onApproved: (captureId: string) => Promise<void>;
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

export default function BookingPaypal({ coachId, durationHours, sessionType, total, onApproved }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId || !container.current) {
      setError('PayPal Checkout doit être configuré pour payer cet appel.');
      return;
    }
    let cancelled = false;
    let buttons: PaypalButtons | undefined;
    const render = async () => {
      const paypal = (window as unknown as { paypal?: PaypalSdk }).paypal;
      if (!paypal || !container.current || cancelled) return;
      container.current.innerHTML = '';
      buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'pill', label: 'paypal', height: 48 },
        createOrder: async () => {
          setError(null);
          const response = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'createBooking', coachId, durationHours, sessionType }),
          });
          const data = await response.json() as { id?: string; error?: string };
          if (!response.ok || !data.id) throw new Error(data.error || 'Création du paiement impossible.');
          return data.id;
        },
        onApprove: async ({ orderID }) => {
          setProcessing(true);
          const response = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'capture', orderId: orderID }),
          });
          const data = await response.json() as {
            completed?: boolean;
            captureId?: string;
            amount?: number;
            booking?: { coachId?: string; durationHours?: number; sessionType?: string };
            error?: string;
          };
          const valid = response.ok && data.completed && data.captureId
            && data.amount === total
            && data.booking?.coachId === coachId
            && data.booking.durationHours === durationHours
            && data.booking.sessionType === sessionType;
          if (!valid) {
            setProcessing(false);
            throw new Error(data.error || 'Le paiement PayPal n’a pas été confirmé.');
          }
          await onApproved(data.captureId!);
        },
        onCancel: () => setError('Paiement annulé. L’appel reste inaccessible.'),
        onError: () => {
          setProcessing(false);
          setError('Le paiement PayPal n’a pas abouti. L’appel reste inaccessible.');
        },
      });
      await buttons.render(container.current);
    };
    const existing = document.getElementById('paypal-checkout-sdk') as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { paypal?: PaypalSdk }).paypal) void render();
      else existing.addEventListener('load', () => void render(), { once: true });
    } else {
      const script = document.createElement('script');
      script.id = 'paypal-checkout-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&intent=capture`;
      script.async = true;
      script.onload = () => void render();
      script.onerror = () => setError('Impossible de charger PayPal. Réessayez plus tard.');
      document.head.appendChild(script);
    }
    return () => { cancelled = true; buttons?.close?.(); };
  }, [coachId, durationHours, onApproved, sessionType, total]);

  return (
    <div className="mt-6 border-t border-brume pt-5">
      <p className="mb-4 flex gap-2 text-xs leading-relaxed text-prune-deep">
        <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
        La salle d’appel sera accessible uniquement après confirmation du paiement PayPal.
      </p>
      {processing ? (
        <p className="flex items-center justify-center gap-2 py-3 text-sm text-prune"><Loader2 size={17} className="animate-spin" />Confirmation du paiement…</p>
      ) : <div ref={container} className="min-h-12" />}
      {error && <p role="alert" className="mt-3 text-center text-sm text-rose">{error}</p>}
    </div>
  );
}
