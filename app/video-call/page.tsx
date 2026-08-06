import type { Metadata } from 'next';
import { Suspense } from 'react';
import VideoCall from '@/components/VideoCall';
import { Chargement } from '@/components/Etats';

export const metadata: Metadata = {
  title: 'Appel vidéo',
  description: "Salle d'appel simulée : minuteur, micro, caméra et raccrochage.",
};

export default function VideoCallPage() {
  return (
    <Suspense fallback={<Chargement label="Ouverture de la salle" />}>
      <VideoCall />
    </Suspense>
  );
}
