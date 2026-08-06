import { NextResponse } from 'next/server';
import { SEED_COACHES } from '@/data/seed';

export const runtime = 'nodejs';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const apiBase = process.env.PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

function payableMedia(mediaId: string) {
  return SEED_COACHES.flatMap((coach) => coach.media)
    .find((media) => media.id === mediaId && media.locked);
}

function payableBooking(customId: string) {
  const [prefix, coachId, durationText, sessionType] = customId.split(':');
  const duration = Number(durationText);
  const coach = SEED_COACHES.find((item) => item.id === coachId);
  if (
    prefix !== 'booking'
    || !coach
    || ![1, 1.5, 2, 3].includes(duration)
    || !['visio', 'studio', 'domicile'].includes(sessionType)
  ) return undefined;
  const amount = coach.hourlyRate * duration + (sessionType === 'domicile' ? 20 : 0);
  return { customId, coach, duration, sessionType, amount };
}

async function accessToken(): Promise<string> {
  if (!clientId || !clientSecret) throw new Error('PAYPAL_NOT_CONFIGURED');
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('PAYPAL_AUTH_FAILED');
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error('PAYPAL_AUTH_FAILED');
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      action?: 'create' | 'createBooking' | 'capture';
      amount?: number;
      mediaId?: string;
      mediaTitle?: string;
      orderId?: string;
      coachId?: string;
      durationHours?: number;
      sessionType?: string;
    };
    const token = await accessToken();

    if (body.action === 'create') {
      const media = body.mediaId ? payableMedia(body.mediaId) : undefined;
      if (!media) {
        return NextResponse.json({ error: 'Données de paiement invalides.' }, { status: 400 });
      }
      const response = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            custom_id: media.id.slice(0, 127),
            description: media.title.slice(0, 127),
            amount: { currency_code: 'EUR', value: media.price.toFixed(2) },
          }],
        }),
        cache: 'no-store',
      });
      const data = await response.json() as { id?: string; message?: string };
      if (!response.ok || !data.id) {
        return NextResponse.json({ error: data.message || 'Création PayPal impossible.' }, { status: 502 });
      }
      return NextResponse.json({ id: data.id });
    }

    if (body.action === 'createBooking') {
      const booking = payableBooking(
        `booking:${body.coachId ?? ''}:${body.durationHours ?? ''}:${body.sessionType ?? ''}`,
      );
      if (!booking) {
        return NextResponse.json({ error: 'Données de réservation invalides.' }, { status: 400 });
      }
      const response = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            custom_id: booking.customId.slice(0, 127),
            description: `Appel vidéo avec ${booking.coach.name}`.slice(0, 127),
            amount: { currency_code: 'EUR', value: booking.amount.toFixed(2) },
          }],
        }),
        cache: 'no-store',
      });
      const data = await response.json() as { id?: string; message?: string };
      if (!response.ok || !data.id) {
        return NextResponse.json({ error: data.message || 'Création PayPal impossible.' }, { status: 502 });
      }
      return NextResponse.json({ id: data.id });
    }

    if (body.action === 'capture' && body.orderId && /^[A-Z0-9]+$/.test(body.orderId)) {
      const response = await fetch(`${apiBase}/v2/checkout/orders/${body.orderId}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store',
      });
      const data = await response.json() as {
        status?: string;
        message?: string;
        purchase_units?: Array<{
          custom_id?: string;
          payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
        }>;
      };
      const unit = data.purchase_units?.[0];
      const capture = unit?.payments?.captures?.[0];
      const media = unit?.custom_id ? payableMedia(unit.custom_id) : undefined;
      const booking = unit?.custom_id ? payableBooking(unit.custom_id) : undefined;
      const expectedAmount = media?.price ?? booking?.amount;
      const amountMatches = expectedAmount !== undefined
        && capture?.amount?.currency_code === 'EUR'
        && capture.amount.value === expectedAmount.toFixed(2);
      if (!response.ok || data.status !== 'COMPLETED' || capture?.status !== 'COMPLETED' || !amountMatches) {
        return NextResponse.json({ error: data.message || 'Le paiement PayPal n’est pas confirmé.' }, { status: 402 });
      }
      return NextResponse.json({
        completed: true,
        orderId: body.orderId,
        captureId: capture.id,
        mediaId: media?.id,
        booking: booking ? {
          coachId: booking.coach.id,
          durationHours: booking.duration,
          sessionType: booking.sessionType,
        } : undefined,
        amount: expectedAmount,
      });
    }

    return NextResponse.json({ error: 'Action PayPal invalide.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error && error.message === 'PAYPAL_NOT_CONFIGURED'
      ? 'PayPal Checkout n’est pas configuré sur le serveur.'
      : 'Le service PayPal est momentanément indisponible.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
