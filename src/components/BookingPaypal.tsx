'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import AlternativePayments from '@/components/AlternativePayments';
import { paypalMeUrl } from '@/lib/paypal';

interface Props {
  total: number;
  onApproved: (reference: string) => Promise<void>;
}

export default function BookingPaypal({ total, onApproved }: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportPayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      await onApproved('paypalme-manual-' + Date.now());
    } catch {
      setProcessing(false);
      setError('La réservation n’a pas pu être enregistrée. Réessayez dans un instant.');
    }
  };

  return (
    <div className="mt-6 border-t border-brume pt-5">
      <p className="mb-4 flex gap-2 text-xs leading-relaxed text-prune-deep">
        <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
        La réservation sera validée après vérification manuelle du paiement PayPal.Me.
      </p>
      <a
        href={paypalMeUrl('', total)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primaire flex w-full items-center justify-center gap-2"
      >
        Payer {total.toFixed(2)} € sur PayPal.Me
        <ExternalLink size={16} aria-hidden="true" />
      </a>
      {processing ? (
        <p className="mt-3 flex items-center justify-center gap-2 py-3 text-sm text-prune">
          <Loader2 size={17} className="animate-spin" />
          Enregistrement de la réservation…
        </p>
      ) : (
        <button type="button" onClick={reportPayment} className="btn-secondaire mt-3 w-full">
          J’ai effectué le paiement
        </button>
      )}
      {error && <p role="alert" className="mt-3 text-center text-sm text-rose">{error}</p>}
      <AlternativePayments />
    </div>
  );
}
