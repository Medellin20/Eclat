import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase optionnel.
 * L'application fonctionne entièrement sans Supabase (repli localStorage).
 * Dès que les deux variables publiques sont renseignées, le client est créé.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'media';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export function isSupabaseEnabled(): boolean {
  return Boolean(url && anonKey);
}

/** URL publique d'un fichier déposé dans le bucket de stockage. */
export function publicMediaUrl(path: string): string {
  const sb = getSupabase();
  if (!sb) return path;
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
