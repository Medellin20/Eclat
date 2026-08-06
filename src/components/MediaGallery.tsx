'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Lock, Play, Maximize2 } from 'lucide-react';
import type { Coach, Media } from '@/types';
import { useApp } from '@/context/AppContext';
import Lightbox from '@/components/Lightbox';
import UnlockModal from '@/components/UnlockModal';

export default function MediaGallery({ coach }: { coach: Coach }) {
  const { isUnlocked, unlockMedia } = useApp();
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
  const [aDebloquer, setADebloquer] = useState<Media | null>(null);

  const photos = useMemo(() => coach.media.filter((m) => m.kind === 'image'), [coach.media]);
  const videos = useMemo(() => coach.media.filter((m) => m.kind === 'video'), [coach.media]);

  // La visionneuse ne présente que les médias réellement accessibles.
  const accessibles = useMemo(
    () => coach.media.filter((m) => !m.locked || isUnlocked(m.id)),
    [coach.media, isUnlocked],
  );

  const ouvrir = (media: Media) => {
    if (media.locked && !isUnlocked(media.id)) {
      setADebloquer(media);
      return;
    }
    const i = accessibles.findIndex((m) => m.id === media.id);
    setVisionneuse(i >= 0 ? i : 0);
  };

  const rendreVignette = (media: Media, ratio: string) => {
    const verrouille = media.locked && !isUnlocked(media.id);
    const apercu = media.kind === 'video' ? media.poster ?? media.url : media.url;

    return (
      <button
        key={media.id}
        type="button"
        onClick={() => ouvrir(media)}
        className={`group/media relative w-full overflow-hidden rounded-3xl border border-brume bg-brume ${ratio}
                    transition-all duration-500 hover:-translate-y-1 hover:shadow-levee`}
        aria-label={
          verrouille
            ? `Débloquer : ${media.title}`
            : `Ouvrir en plein écran : ${media.title}`
        }
      >
        {verrouille ? (
          <span className="absolute inset-0 bg-gradient-to-br from-rose-wash via-brume to-prune/25" />
        ) : (
          <Image
            src={apercu}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-[900ms] group-hover/media:scale-105"
          />
        )}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-encre/75 to-transparent" />

        {verrouille ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-prune shadow-douce transition-transform duration-300 group-hover/media:scale-110">
              <Lock size={18} strokeWidth={2.2} aria-hidden="true" />
            </span>
          </span>
        ) : media.kind === 'video' ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 pl-0.5 text-prune shadow-douce transition-transform duration-300 group-hover/media:scale-110">
              <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            </span>
          </span>
        ) : (
          <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/0 text-white opacity-0 transition-all duration-300 group-hover/media:bg-white/20 group-hover/media:opacity-100">
            <Maximize2 size={15} aria-hidden="true" />
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 text-left">
          <span className="text-[0.78rem] font-medium leading-snug text-white drop-shadow">
            {media.title}
          </span>
          {verrouille && (
            <span className="tabulaire shrink-0 rounded-full bg-white/95 px-2.5 py-1 text-[0.68rem] font-semibold text-prune-deep">
              {media.price.toFixed(2)} €
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <>
      <section aria-labelledby="titre-photos" className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="titre-photos" className="font-display text-2xl text-encre">
            Photos
          </h2>
          <p className="text-sm text-ardoise">
            {photos.filter((p) => !p.locked || isUnlocked(p.id)).length} sur {photos.length} accessibles
          </p>
        </div>
        {photos.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-dashed border-brume p-8 text-center text-sm text-ardoise">
            Aucune photo pour le moment.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((m) => rendreVignette(m, 'aspect-[4/5]'))}
          </div>
        )}
      </section>

      <section aria-labelledby="titre-videos" className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="titre-videos" className="font-display text-2xl text-encre">
            Vidéos
          </h2>
          <p className="text-sm text-ardoise">
            {videos.filter((v) => !v.locked || isUnlocked(v.id)).length} sur {videos.length} accessibles
          </p>
        </div>
        {videos.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-dashed border-brume p-8 text-center text-sm text-ardoise">
            Aucune vidéo pour le moment.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((m) => rendreVignette(m, 'aspect-video'))}
          </div>
        )}
      </section>

      {visionneuse !== null && accessibles.length > 0 && (
        <Lightbox
          items={accessibles}
          index={Math.min(visionneuse, accessibles.length - 1)}
          onClose={() => setVisionneuse(null)}
          onIndexChange={setVisionneuse}
        />
      )}

      {aDebloquer && (
        <UnlockModal
          media={aDebloquer}
          coachName={coach.name}
          onClose={() => setADebloquer(null)}
          onConfirm={(paypalReference) => unlockMedia(aDebloquer, paypalReference)}
        />
      )}
    </>
  );
}
