'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Media } from '@/types';

interface Props {
  items: Media[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = items[index];

  const suivant = useCallback(() => {
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  const precedent = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  // Échap ferme, flèches naviguent.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        suivant();
      } else if (e.key === 'ArrowLeft') {
        precedent();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, suivant, precedent]);

  // Bloque le défilement de la page et met le focus sur le bouton de fermeture.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      className="fixed inset-0 z-[100] flex flex-col bg-encre/95 backdrop-blur-md animate-apparition"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <p className="min-w-0 truncate text-sm font-medium text-white/90">{current.title}</p>
        <div className="flex items-center gap-3">
          <span className="tabulaire text-xs text-white/50">
            {index + 1} / {items.length}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fermer la visionneuse (Échap)"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-4 pb-8 sm:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {items.length > 1 && (
          <button
            type="button"
            onClick={precedent}
            className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
            aria-label="Média précédent"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}

        <div className="relative h-full max-h-[78vh] w-full max-w-4xl">
          {current.kind === 'image' ? (
            <Image
              src={current.url}
              alt={current.title}
              fill
              sizes="100vw"
              className="rounded-3xl object-contain"
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={current.url}
              poster={current.poster}
              controls
              autoPlay
              loop
              playsInline
              className="h-full w-full rounded-3xl object-contain"
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={suivant}
            className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
            aria-label="Média suivant"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
