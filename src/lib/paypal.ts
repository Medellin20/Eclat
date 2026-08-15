export function normalizePaypalMeProfile(value: string): string {
  return value.trim().replace(/^https?:\/\/(?:www\.)?paypal\.me\//i, '').replace(/\/$/, '');
}

export function isPaypalConfigured(profile: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(profile);
}

export function paypalMeUrl(profile: string, amount: number): string {
  return `https://www.paypal.me/${encodeURIComponent(profile)}/${amount.toFixed(2)}EUR`;
}
