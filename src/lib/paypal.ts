export function normalizePaypalMeProfile(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?paypal\.me\//i, '')
    .replace(/^https?:\/\/(?:www\.)?paypal\.com\/paypalme\//i, '')
    .replace(/\/$/, '');
}

export function isPaypalConfigured(profile: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(profile);
}

export function paypalMeUrl(profile: string, _amount: number): string {
  return 'https://www.paypal.com/paypalme/' + encodeURIComponent(profile);
}
