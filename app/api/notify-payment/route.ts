import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * POST /api/notify-payment
 *
 * Envoie une notification interne lorsqu'un déblocage de contenu est simulé.
 *
 * Cette route ne reçoit et ne transmet JAMAIS de données de paiement :
 * numéros de carte, cryptogrammes, IBAN, codes de cartes cadeaux ou identifiants
 * de portefeuille sont explicitement rejetés (HTTP 422). Seules des métadonnées
 * non sensibles circulent : identifiant du média, titre, praticien, montant.
 *
 * Les identifiants SMTP proviennent de variables serveur (jamais NEXT_PUBLIC_).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Champs interdits — leur seule présence invalide la requête. */
const CHAMPS_INTERDITS = [
  'card',
  'cardnumber',
  'cardnumer',
  'cvv',
  'cvc',
  'pan',
  'iban',
  'bic',
  'giftcard',
  'giftcode',
  'redeemcode',
  'voucher',
  'pin',
  'securitycode',
  'accountnumber',
  'routingnumber',
  'sortcode',
  'creditcard',
  'paypal',
  'wallet',
  'seedphrase',
];

interface Corps {
  mediaId?: unknown;
  mediaTitle?: unknown;
  coachName?: unknown;
  amount?: unknown;
  customerEmail?: unknown;
  photoNumber?: unknown;
}

function estTexteCourt(v: unknown, max = 200): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/** Recherche récursive d'un champ sensible, quelle que soit la profondeur. */
function contientChampInterdit(valeur: unknown, profondeur = 0): boolean {
  if (profondeur > 4 || valeur === null || typeof valeur !== 'object') return false;
  for (const [cle, sousValeur] of Object.entries(valeur as Record<string, unknown>)) {
    const normalisee = cle.toLowerCase().replace(/[^a-z]/g, '');
    if (CHAMPS_INTERDITS.some((interdit) => normalisee.includes(interdit))) return true;
    if (contientChampInterdit(sousValeur, profondeur + 1)) return true;
  }
  return false;
}

export async function POST(request: Request) {
  // --- 1. Type de contenu
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { ok: false, error: 'Content-Type attendu : application/json.' },
      { status: 415 },
    );
  }

  // --- 2. Analyse du corps
  let corps: Corps;
  try {
    corps = (await request.json()) as Corps;
  } catch {
    return NextResponse.json({ ok: false, error: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (typeof corps !== 'object' || corps === null) {
    return NextResponse.json({ ok: false, error: 'Corps JSON invalide.' }, { status: 400 });
  }

  // --- 3. Refus explicite de toute donnée de paiement
  if (contientChampInterdit(corps)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Cette route n’accepte aucune donnée bancaire ni code de carte cadeau. Utilisez un prestataire de paiement certifié.',
      },
      { status: 422 },
    );
  }

  // --- 4. Validation métier
  const erreurs: string[] = [];
  if (!estTexteCourt(corps.mediaId, 64)) erreurs.push('mediaId est requis.');
  if (!estTexteCourt(corps.mediaTitle)) erreurs.push('mediaTitle est requis.');
  if (!estTexteCourt(corps.coachName, 120)) erreurs.push('coachName est requis.');
  if (typeof corps.amount !== 'number' || !Number.isFinite(corps.amount) || corps.amount < 0) {
    erreurs.push('amount doit être un nombre positif.');
  }
  if (!estTexteCourt(corps.customerEmail, 254) || !/^\S+@\S+\.\S+$/.test(corps.customerEmail)) {
    erreurs.push('customerEmail doit être une adresse e-mail valide.');
  }
  if (corps.photoNumber !== undefined && (!Number.isInteger(corps.photoNumber) || Number(corps.photoNumber) < 1)) {
    erreurs.push('photoNumber doit être un entier positif.');
  }

  if (erreurs.length > 0) {
    return NextResponse.json({ ok: false, errors: erreurs }, { status: 400 });
  }

  const details = {
    mediaId: String(corps.mediaId),
    mediaTitle: String(corps.mediaTitle),
    coachName: String(corps.coachName),
    amount: Number(corps.amount),
    customerEmail: String(corps.customerEmail),
    photoNumber: corps.photoNumber === undefined ? undefined : Number(corps.photoNumber),
  };

  // --- 5. Envoi SMTP (optionnel : la démonstration fonctionne sans)
  const { EMAIL_USER, EMAIL_PASS, NOTIFY_TO } = process.env;
  const host = process.env.EMAIL_HOST ?? 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT ?? 465);

  if (!EMAIL_USER || !EMAIL_PASS || !NOTIFY_TO) {
    return NextResponse.json(
      {
        ok: true,
        delivered: false,
        reason:
          'SMTP non configuré. Renseignez EMAIL_USER, EMAIL_PASS et NOTIFY_TO pour activer l’envoi.',
        details,
      },
      { status: 202 },
    );
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transport.sendMail({
      from: `Éclat <${EMAIL_USER}>`,
      to: NOTIFY_TO,
      subject: `Paiement PayPal.Me à vérifier${details.photoNumber ? ` — Photo n°${details.photoNumber}` : ''}`,
      text: [
        'Un client indique avoir effectué un paiement PayPal.Me.',
        'Vérifiez la réception des fonds avant tout envoi.',
        '',
        `Praticien : ${details.coachName}`,
        ...(details.photoNumber ? [`Photo     : n°${details.photoNumber}`] : []),
        `Média     : ${details.mediaTitle} (${details.mediaId})`,
        `Montant   : ${details.amount.toFixed(2)} EUR`,
        `E-mail    : ${details.customerEmail}`,
        `Horodatage: ${new Date().toISOString()}`,
        '',
        'Après vérification, envoyez la photo à l’adresse indiquée.',
      ].join('\n'),
    });

    return NextResponse.json({ ok: true, delivered: true, details }, { status: 200 });
  } catch {
    // On ne renvoie jamais le détail de l'erreur SMTP au client.
    return NextResponse.json(
      { ok: false, error: 'L’envoi de la notification a échoué. Vérifiez la configuration SMTP.' },
      { status: 502 },
    );
  }
}

/** Toute autre méthode est refusée explicitement. */
function refus() {
  return NextResponse.json(
    { ok: false, error: 'Méthode non autorisée. Utilisez POST.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

export const GET = refus;
export const PUT = refus;
export const PATCH = refus;
export const DELETE = refus;
