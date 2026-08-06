/**
 * Remplacez uniquement la valeur ci-dessous par votre identifiant PayPal.Me.
 * Exemple : pour https://paypal.me/monprofil, indiquez "monprofil".
 */
export const PAYPAL_ME_PROFILE = 'paypal.me/jeandupont';

export function isPaypalConfigured(): boolean {
  return PAYPAL_ME_PROFILE !== 'paypal.me/jeandupont' && /^[A-Za-z0-9._-]+$/.test(PAYPAL_ME_PROFILE);
}

export function paypalMeUrl(amount: number): string {
  return `https://www.paypal.me/${encodeURIComponent(PAYPAL_ME_PROFILE)}/${amount.toFixed(2)}EUR`;
}
