import type { AppState } from '@/types';
import { getSupabase, isSupabaseEnabled } from '@/lib/supabase';

/**
 * Persistance à deux niveaux.
 *
 * 1. Si les variables Supabase sont présentes : lecture/écriture dans la table
 *    publique `app_state` (une seule ligne, colonne jsonb `data`).
 * 2. Sinon — ou en cas d'erreur réseau — repli sur IndexedDB, qui accepte
 *    les photos et vidéos encodées sans la petite limite de localStorage.
 *
 * Le repli local garantit que la démonstration fonctionne hors ligne.
 */

const LOCAL_KEY = 'eclat.state.v1';
const DB_NAME = 'eclat';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const ROW_ID = 'singleton';
const TABLE = 'app_state';

export function readLocal(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!Array.isArray(parsed.coaches)) return null;
    return {
      coaches: parsed.coaches,
      bookings: parsed.bookings ?? [],
      purchases: parsed.purchases ?? [],
    };
  } catch {
    return null;
  }
}

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Charge d'abord IndexedDB, puis migre au besoin l'ancien localStorage. */
export async function readDurableLocal(): Promise<AppState | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return readLocal();
  try {
    const db = await openLocalDb();
    const stored = await new Promise<AppState | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(LOCAL_KEY);
      request.onsuccess = () => resolve((request.result as AppState | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (stored && Array.isArray(stored.coaches)) return stored;

    const legacy = readLocal();
    if (legacy) await writeDurableLocal(legacy);
    return legacy;
  } catch {
    return readLocal();
  }
}

export function writeLocal(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    // Quota dépassé ou stockage bloqué : on ignore silencieusement.
  }
}

/** Sauvegarde durable, y compris lorsque l'état contient des fichiers volumineux. */
export async function writeDurableLocal(state: AppState): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    writeLocal(state);
    return true;
  }
  try {
    const db = await openLocalDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(state, LOCAL_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
    return true;
  } catch {
    writeLocal(state);
    return false;
  }
}

export function clearLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* rien à faire */
  }
  if (typeof window !== 'undefined' && window.indexedDB) {
    void openLocalDb().then((db) => {
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(LOCAL_KEY);
      db.close();
    });
  }
}

export async function loadRemote(): Promise<AppState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from(TABLE)
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (error || !data?.data) return null;
    const remote = data.data as Partial<AppState>;
    if (!Array.isArray(remote.coaches)) return null;
    return {
      coaches: remote.coaches,
      bookings: remote.bookings ?? [],
      purchases: remote.purchases ?? [],
    };
  } catch {
    return null;
  }
}

export async function saveRemote(state: AppState): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb
      .from(TABLE)
      .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}

export { isSupabaseEnabled };
