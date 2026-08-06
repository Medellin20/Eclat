import type { Coach, Media } from '@/types';

/**
 * Jeu de démonstration.
 * Tous les visuels de `public/media` ont été générés spécifiquement pour ce projet :
 * ce sont des dégradés abstraits originaux, utilisables sans restriction.
 */

interface SeedInput {
  id: string;
  name: string;
  age: number;
  location: string;
  headline: string;
  description: string;
  specialties: string[];
  hourlyRate: number;
  rating: number;
  reviews: number;
  photoTitles: [string, string, string];
  videoTitles: [string, string];
}

const RAW: SeedInput[] = [
  {
    id: 'EvaLaBelle',
    name: 'EvaLaBelle',
    age: 28,
    location: 'Paris',
    headline: 'Massage avec extras',
    description:
      "Eva de taille 1m68 pesant 59kg, Passionnée , prête à vivre des instants délicieux sans s'attacher à l'idée du futur. J'aime l'intensité des moments partagés sans promesses, juste l'exploration de l'instant. Curieuse, audacieuse et sans regrets, je recherche un plaisir immédiat, une complicité sans lendemain, un frisson sans engagement. Es-tu prêt à goûter à l'instant présent sans retour en arrière ?",
    specialties: ['Hatha', 'Respiration', 'Mobilité'],
    hourlyRate: 150,
    rating: 4.9,
    reviews: 128,
    photoTitles: ['Salle de pratique', 'Séance du matin', 'Atelier respiration — accès premium'],
    videoTitles: ['Échauffement guidé (extrait)', 'Séquence complète 30 min — accès premium'],
  },
];

function buildMedia(input: SeedInput): Media[] {
  const photos: Media[] = input.photoTitles.map((title, index) => ({
    id: `${input.id}-p${index + 1}`,
    coachId: input.id,
    kind: 'image' as const,
    url: `/media/${input.id}-0${index + 1}.jpg`,
    title,
    locked: index === 2,
    price: 25,
  }));

  const videos: Media[] = input.videoTitles.map((title, index) => ({
    id: `${input.id}-v${index + 1}`,
    coachId: input.id,
    kind: 'video' as const,
    url: `/media/${input.id}-v${index + 1}.mp4`,
    poster: `/media/${input.id}-v${index + 1}-poster.jpg`,
    title,
    locked: index === 1,
    price: 60,
  }));

  return [...photos, ...videos];
}

export const SEED_COACHES: Coach[] = RAW.map((input) => ({
  id: input.id,
  name: input.name,
  age: input.age,
  location: input.location,
  headline: input.headline,
  description: input.description,
  specialties: input.specialties,
  hourlyRate: input.hourlyRate,
  rating: input.rating,
  reviews: input.reviews,
  mainPhoto: `/media/${input.id}-cover.jpg`,
  media: buildMedia(input),
  createdAt: '2026-01-15T09:00:00.000Z',
}));
