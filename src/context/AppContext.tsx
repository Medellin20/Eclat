'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, Booking, Coach, Media, Purchase } from '@/types';
import { makeId } from '@/lib/format';
import {
  isSupabaseEnabled,
  loadRemote,
  readDurableLocal,
  saveRemote,
  writeDurableLocal,
} from '@/lib/persistence';

interface AppContextValue {
  coaches: Coach[];
  bookings: Booking[];
  purchases: Purchase[];
  /** false tant que l'état initial n'est pas chargé (évite un flash de contenu vide). */
  ready: boolean;
  /** true si les variables Supabase sont configurées. */
  remoteEnabled: boolean;
  error: string | null;

  getCoach: (id: string) => Coach | undefined;
  addCoach: (coach: Omit<Coach, 'id' | 'createdAt'>) => Coach;
  updateCoach: (id: string, patch: Partial<Omit<Coach, 'id'>>) => void;
  removeCoach: (id: string) => void;

  addMedia: (coachId: string, media: Omit<Media, 'id' | 'coachId'>) => void;
  removeMedia: (coachId: string, mediaId: string) => void;
  setMainPhoto: (coachId: string, url: string) => void;

  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  cancelBooking: (id: string) => void;

  unlockMedia: (media: Media, paypalReference: string) => Purchase;
  isUnlocked: (mediaId: string) => boolean;

  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL: AppState = {
  coaches: [],
  bookings: [],
  purchases: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // --- Chargement initial : Supabase si disponible, sinon IndexedDB, sinon seed.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        if (isSupabaseEnabled()) {
          const remote = await loadRemote();
          if (!cancelled && remote) {
            setState(remote);
            hydrated.current = true;
            setReady(true);
            return;
          }
        }
        const local = await readDurableLocal();
        if (!cancelled) {
          setState(local ?? INITIAL);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les données. Le jeu de démonstration est utilisé.");
          setState(INITIAL);
        }
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setReady(true);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Sauvegarde à chaque modification (jamais avant l'hydratation).
  useEffect(() => {
    if (!hydrated.current) return;
    void writeDurableLocal(state).then((saved) => {
      if (!saved) setError("Le stockage du navigateur est saturé : certaines modifications peuvent ne pas être conservées.");
    });
    if (isSupabaseEnabled()) {
      void saveRemote(state);
    }
  }, [state]);

  const getCoach = useCallback(
    (id: string) => state.coaches.find((c) => c.id === id),
    [state.coaches],
  );

  const addCoach = useCallback((coach: Omit<Coach, 'id' | 'createdAt'>) => {
    const created: Coach = {
      ...coach,
      id: makeId('coach'),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, coaches: [created, ...s.coaches] }));
    return created;
  }, []);

  const updateCoach = useCallback((id: string, patch: Partial<Omit<Coach, 'id'>>) => {
    setState((s) => ({
      ...s,
      coaches: s.coaches.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCoach = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      coaches: s.coaches.filter((c) => c.id !== id),
      bookings: s.bookings.filter((b) => b.coachId !== id),
    }));
  }, []);

  const addMedia = useCallback((coachId: string, media: Omit<Media, 'id' | 'coachId'>) => {
    setState((s) => ({
      ...s,
      coaches: s.coaches.map((c) =>
        c.id === coachId
          ? { ...c, media: [...c.media, { ...media, id: makeId('media'), coachId }] }
          : c,
      ),
    }));
  }, []);

  const removeMedia = useCallback((coachId: string, mediaId: string) => {
    setState((s) => ({
      ...s,
      coaches: s.coaches.map((c) =>
        c.id === coachId ? { ...c, media: c.media.filter((m) => m.id !== mediaId) } : c,
      ),
    }));
  }, []);

  const setMainPhoto = useCallback((coachId: string, url: string) => {
    setState((s) => ({
      ...s,
      coaches: s.coaches.map((c) => (c.id === coachId ? { ...c, mainPhoto: url } : c)),
    }));
  }, []);

  const addBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const created: Booking = {
      ...booking,
      id: makeId('resa'),
      createdAt: new Date().toISOString(),
    };
    const nextState = { ...state, bookings: [created, ...state.bookings] };
    setState(nextState);
    await writeDurableLocal(nextState);
    if (isSupabaseEnabled()) await saveRemote(nextState);
    return created;
  }, [state]);

  const cancelBooking = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'annulee' } : b)),
    }));
  }, []);

  /** Enregistre uniquement la référence renvoyée après capture PayPal. */
  const unlockMedia = useCallback((media: Media, paypalReference: string) => {
    const purchase: Purchase = {
      id: makeId('achat'),
      mediaId: media.id,
      coachId: media.coachId,
      amount: media.price,
      reference: paypalReference,
      createdAt: new Date().toISOString(),
    };
    setState((s) =>
      s.purchases.some((p) => p.mediaId === media.id)
        ? s
        : { ...s, purchases: [purchase, ...s.purchases] },
    );
    return purchase;
  }, []);

  const isUnlocked = useCallback(
    (mediaId: string) => state.purchases.some((p) => p.mediaId === mediaId),
    [state.purchases],
  );

  const resetDemo = useCallback(() => {
    setState(INITIAL);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      coaches: state.coaches,
      bookings: state.bookings,
      purchases: state.purchases,
      ready,
      remoteEnabled: isSupabaseEnabled(),
      error,
      getCoach,
      addCoach,
      updateCoach,
      removeCoach,
      addMedia,
      removeMedia,
      setMainPhoto,
      addBooking,
      cancelBooking,
      unlockMedia,
      isUnlocked,
      resetDemo,
    }),
    [
      state,
      ready,
      error,
      getCoach,
      addCoach,
      updateCoach,
      removeCoach,
      addMedia,
      removeMedia,
      setMainPhoto,
      addBooking,
      cancelBooking,
      unlockMedia,
      isUnlocked,
      resetDemo,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp doit être utilisé à l\'intérieur de <AppProvider>.');
  }
  return ctx;
}
