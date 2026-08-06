import type { Metadata } from 'next';
import CoachDetail from '@/components/CoachDetail';
import { SEED_COACHES } from '@/data/seed';

// Pré-génère les profils de démonstration ; les profils créés depuis
// l'administration sont rendus à la demande.
export function generateStaticParams() {
  return SEED_COACHES.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const coach = SEED_COACHES.find((c) => c.id === params.id);
  return {
    title: coach ? coach.name : 'Profil',
    description: coach?.headline,
  };
}

export default function CoachPage({ params }: { params: { id: string } }) {
  return <CoachDetail id={params.id} />;
}
