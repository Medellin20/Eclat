import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'eclat_admin_session';

function equals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret) return null;
  return { password, token: createHmac('sha256', secret).update(password).digest('hex') };
}

export function isAdminRequest(request: NextRequest) {
  const config = getAdminConfig();
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? '';
  return Boolean(config && equals(token, config.token));
}

export function isAdminPassword(value: string) {
  const config = getAdminConfig();
  return Boolean(config && equals(value, config.password));
}
