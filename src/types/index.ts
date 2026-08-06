/**
 * Types du domaine.
 * Ces quatre entités structurent toute l'application :
 * Coach (le profil), Media (photo/vidéo), Booking (réservation), Purchase (déblocage PayPal).
 */

export type MediaKind = 'image' | 'video';

export interface Media {
  id: string;
  coachId: string;
  kind: MediaKind;
  /** Chemin local (public/media) ou URL publique Supabase Storage. */
  url: string;
  /** Vignette affichée pour les vidéos. */
  poster?: string;
  title: string;
  /** true = contenu premium, nécessite un déblocage. */
  locked: boolean;
  /** Prix du déblocage PayPal en euros. */
  price: number;
}

export interface Coach {
  id: string;
  name: string;
  age: number;
  location: string;
  /** Accroche courte affichée sur la carte. */
  headline: string;
  description: string;
  specialties: string[];
  /** Tarif horaire en euros. */
  hourlyRate: number;
  /** Note de 0 à 5. */
  rating: number;
  reviews: number;
  /** Photo principale (couverture). */
  mainPhoto: string;
  media: Media[];
  createdAt: string;
}

export type SessionType = 'visio' | 'studio' | 'domicile';
export type BookingStatus = 'en_attente' | 'confirmee' | 'annulee';

export interface Booking {
  id: string;
  coachId: string;
  coachName: string;
  coachPhoto: string;
  /** Format ISO court : AAAA-MM-JJ. */
  date: string;
  /** Format HH:MM. */
  time: string;
  durationHours: number;
  sessionType: SessionType;
  clientName: string;
  phone: string;
  message?: string;
  total: number;
  status: BookingStatus;
  /** Identifiant de capture PayPal confirmé par le serveur. */
  paypalReference?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  mediaId: string;
  coachId: string;
  amount: number;
  /** Identifiant de capture PayPal confirmé par le serveur. */
  reference: string;
  createdAt: string;
}

export interface AppState {
  coaches: Coach[];
  bookings: Booking[];
  purchases: Purchase[];
}

/** Données du formulaire de réservation avant validation. */
export interface BookingDraft {
  coachId: string;
  date: string;
  time: string;
  durationHours: number;
  sessionType: SessionType;
  clientName: string;
  phone: string;
  message: string;
}

export const SESSION_LABELS: Record<SessionType, string> = {
  visio: 'Visioconférence',
  studio: 'En studio',
  domicile: 'À domicile',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
};
