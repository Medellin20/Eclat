import { Bitcoin, CreditCard, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const STEAM_CARD_URL = 'https://www.eneba.com/store/steam-gift-cards';

function getSteamVerificationUrl(): string {
  const value = process.env.NEXT_PUBLIC_STEAM_VERIFICATION_URL?.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export default function AlternativePayments() {
  const [steamOpened, setSteamOpened] = useState(false);
  const verificationUrl = getSteamVerificationUrl();

  return (
    <div className="mt-5 border-t border-brume pt-5">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-ardoise">
        Autres modes de paiement
      </p>
      <a
        href={STEAM_CARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setSteamOpened(true)}
        className="btn-secondaire flex w-full items-center justify-center gap-2"
      >
        <CreditCard size={17} aria-hidden="true" />
        Payer par carte Steam
        <ExternalLink size={15} aria-hidden="true" />
      </a>
      {steamOpened && (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-center text-sm text-emerald-900">
            Authentifiez votre carte pour recevoir la photo.
          </p>
          {verificationUrl ? (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Vérifier ma commande
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="mt-3 w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white opacity-50"
            >
              Vérifier ma commande — lien à configurer
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        disabled
        title="L’adresse Bitcoin sera ajoutée prochainement"
        className="btn-secondaire mt-3 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Bitcoin size={17} aria-hidden="true" />
        Payer par Bitcoin — bientôt disponible
      </button>
    </div>
  );
}
