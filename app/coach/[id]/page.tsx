import type { Metadata } from 'next';
import CoachDetail from '@/components/CoachDetail';

export function generateStaticParams() {
  return [];
}

export function generateMetadata(): Metadata {
  return {
    title: 'Profil',
  };
}

export default function CoachPage({ params }: { params: { id: string } }) {
  return <CoachDetail id={params.id} />;
}
