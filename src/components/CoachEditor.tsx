'use client';

import Image from 'next/image';
import { type ChangeEvent, useEffect, useState } from 'react';
import { Check, ImagePlus, Lock, Star, Trash2, Unlock, Upload, X } from 'lucide-react';
import type { Coach, Media, MediaKind } from '@/types';
import { useApp } from '@/context/AppContext';
import { Erreur } from '@/components/Etats';

interface Props {
  coach: Coach | null; // null = création
  onClose: () => void;
}

interface Champs {
  name: string;
  age: string;
  headline: string;
  description: string;
  specialties: string;
  hourlyRate: string;
  rating: string;
  mainPhoto: string;
}

const VIDE: Champs = {
  name: '',
  age: '30',
  headline: '',
  description: '',
  specialties: '',
  hourlyRate: '80',
  rating: '4.8',
  mainPhoto: '/media/4.jpeg',
};

const TAILLE_PHOTO_MAX = 3 * 1024 * 1024;
const TAILLE_VIDEO_MAX = 25 * 1024 * 1024;

function verifierFichier(file: File, kind: MediaKind) {
  const typeAttendu = kind === 'image' ? 'image/' : 'video/';
  const tailleMax = kind === 'image' ? TAILLE_PHOTO_MAX : TAILLE_VIDEO_MAX;
  if (!file.type.startsWith(typeAttendu)) throw new Error(`Le fichier sélectionné doit être ${kind === 'image' ? 'une image' : 'une vidéo'}.`);
  if (file.size > tailleMax) throw new Error(kind === 'image' ? 'La photo ne doit pas dépasser 3 Mo.' : 'La vidéo ne doit pas dépasser 25 Mo.');
}

async function televerser(file: File, kind: MediaKind): Promise<string> {
  verifierFichier(file, kind);
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  const response = await fetch('/api/admin/media', { method: 'POST', body: form });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? 'Impossible d’envoyer le fichier vers Supabase.');
  return data.url;
}

export default function CoachEditor({ coach, onClose }: Props) {
  const { addCoach, updateCoach, addMedia, removeMedia, setMainPhoto, coaches } = useApp();

  const [champs, setChamps] = useState<Champs>(
    coach
      ? {
          name: coach.name,
          age: String(coach.age),
          headline: coach.headline,
          description: coach.description,
          specialties: coach.specialties.join(', '),
          hourlyRate: String(coach.hourlyRate),
          rating: String(coach.rating),
          mainPhoto: coach.mainPhoto,
        }
      : VIDE,
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [televersement, setTeleversement] = useState(false);

  // Nouveau média
  const [mKind, setMKind] = useState<MediaKind>('image');
  const [mUrl, setMUrl] = useState('');
  const [mPoster, setMPoster] = useState('');
  const [mLocked, setMLocked] = useState(false);
  const [mPrice, setMPrice] = useState('25');
  const [nomPhoto, setNomPhoto] = useState('');
  const [nomMedia, setNomMedia] = useState('');
  const [nomPoster, setNomPoster] = useState('');

  // Version à jour du profil (les médias changent au fil des ajouts).
  const courant = coach ? coaches.find((c) => c.id === coach.id) ?? coach : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = <K extends keyof Champs>(cle: K, valeur: string) => {
    setChamps((c) => ({ ...c, [cle]: valeur }));
    setErreur(null);
    setEnregistre(false);
  };

  const chargerPhoto = async (
    event: ChangeEvent<HTMLInputElement>,
    destination: 'principale' | 'media' | 'poster',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setTeleversement(true);
      const contenu = await televerser(file, 'image');
      if (destination === 'principale') {
        set('mainPhoto', contenu);
        setNomPhoto(file.name);
      } else if (destination === 'media') {
        setMUrl(contenu);
        setNomMedia(file.name);
      } else {
        setMPoster(contenu);
        setNomPoster(file.name);
      }
      setErreur(null);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Impossible de charger cette photo.');
      event.target.value = '';
    } finally {
      setTeleversement(false);
    }
  };

  const chargerVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setTeleversement(true);
      setMUrl(await televerser(file, 'video'));
      setNomMedia(file.name);
      setErreur(null);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Impossible de charger cette vidéo.');
      event.target.value = '';
    } finally {
      setTeleversement(false);
    }
  };

  const supprimerMedia = async (media: Media) => {
    try {
      const urls = [media.url, media.poster].filter((url): url is string => Boolean(url));
      await Promise.all(urls.map(async (url) => {
        const response = await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? 'Suppression distante impossible.');
        }
      }));
      if (courant) {
        if (courant.mainPhoto === media.url) setMainPhoto(courant.id, VIDE.mainPhoto);
        removeMedia(courant.id, media.id);
      }
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Impossible de supprimer ce média.');
    }
  };

  const changerTypeMedia = (kind: MediaKind) => {
    setMKind(kind);
    setMUrl('');
    setNomMedia('');
    setErreur(null);
  };

  const enregistrer = () => {
    if (champs.name.trim().length < 2) {
      setErreur('Le nom doit contenir au moins deux caractères.');
      return;
    }
    if (!champs.headline.trim()) {
      setErreur('Ajoutez une accroche : elle s’affiche sur la carte du profil.');
      return;
    }
    const tarif = Number(champs.hourlyRate);
    if (!Number.isFinite(tarif) || tarif <= 0) {
      setErreur('Le tarif horaire doit être un nombre supérieur à zéro.');
      return;
    }

    const donnees = {
      name: champs.name.trim(),
      age: Math.max(18, Number(champs.age) || 30),
      location: coach?.location ?? '',
      headline: champs.headline.trim(),
      description: champs.description.trim(),
      specialties: champs.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      hourlyRate: tarif,
      rating: Math.min(5, Math.max(0, Number(champs.rating) || 5)),
      reviews: coach?.reviews ?? 0,
      mainPhoto: champs.mainPhoto.trim() || VIDE.mainPhoto,
      media: coach?.media ?? [],
    };

    if (coach) {
      updateCoach(coach.id, donnees);
      setEnregistre(true);
    } else {
      addCoach(donnees);
      onClose();
    }
  };

  const ajouterMedia = () => {
    if (!courant) return;
    if (!mUrl.trim()) {
      setErreur(`Sélectionnez ${mKind === 'image' ? 'une photo' : 'une vidéo'} depuis votre poste.`);
      return;
    }
    if (mKind === 'video' && !mPoster.trim()) {
      setErreur('Sélectionnez une vignette pour cette vidéo.');
      return;
    }
    addMedia(courant.id, {
      kind: mKind,
      url: mUrl.trim(),
      poster: mKind === 'video' ? mPoster.trim() || undefined : undefined,
      title: `${mKind === 'image' ? 'Photo' : 'Vidéo'} ${courant.media.filter((media) => media.kind === mKind).length + 1}`,
      locked: mLocked,
      price: Math.max(0, Number(mPrice) || 0),
    });
    setMUrl('');
    setMPoster('');
    setNomMedia('');
    setNomPoster('');
    setErreur(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-editeur"
      className="fixed inset-0 z-[105] overflow-y-auto bg-encre/60 px-4 py-8 backdrop-blur-sm animate-apparition"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-4xl bg-white shadow-levee animate-montee"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brume bg-white/95 px-7 py-5 backdrop-blur">
          <h2 id="titre-editeur" className="font-display text-2xl text-encre">
            {coach ? `Modifier ${coach.name}` : 'Nouveau profil'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ardoise transition-colors hover:bg-brume hover:text-encre"
            aria-label="Fermer l’éditeur"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="px-7 py-6">
          {erreur && (
            <div className="mb-5">
              <Erreur message={erreur} />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="a-name" className="etiquette">Nom</label>
              <input id="a-name" className="champ" value={champs.name} onChange={(e) => set('name', e.target.value)} />
            </div>

            <div>
              <label htmlFor="a-age" className="etiquette">Âge</label>
              <input id="a-age" type="number" min={18} max={99} className="champ" value={champs.age} onChange={(e) => set('age', e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="a-headline" className="etiquette">Accroche</label>
              <input id="a-headline" className="champ" value={champs.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Yoga doux et travail du souffle" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="a-description" className="etiquette">Description</label>
              <textarea id="a-description" rows={5} className="champ resize-y" value={champs.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="a-specialties" className="etiquette">
                Spécialités <span className="font-normal normal-case tracking-normal">(séparées par des virgules)</span>
              </label>
              <input id="a-specialties" className="champ" value={champs.specialties} onChange={(e) => set('specialties', e.target.value)} placeholder="Hatha, Respiration, Mobilité" />
            </div>

            <div>
              <label htmlFor="a-rate" className="etiquette">Tarif horaire (€)</label>
              <input id="a-rate" type="number" min={1} className="champ tabulaire" value={champs.hourlyRate} onChange={(e) => set('hourlyRate', e.target.value)} />
            </div>

            <div>
              <label htmlFor="a-rating" className="etiquette">Note (0 à 5)</label>
              <input id="a-rating" type="number" min={0} max={5} step={0.1} className="champ tabulaire" value={champs.rating} onChange={(e) => set('rating', e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <span className="etiquette">Photo principale</span>
              <div className="flex items-center gap-4 rounded-2xl border border-brume bg-porcelaine p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brume">
                  <Image src={champs.mainPhoto || VIDE.mainPhoto} alt="Aperçu de la photo principale" fill sizes="80px" className="object-cover" unoptimized={champs.mainPhoto.startsWith('data:')} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="a-photo" className="btn-secondaire cursor-pointer">
                    <Upload size={15} aria-hidden="true" />
                    Importer une photo
                  </label>
                  <input id="a-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => void chargerPhoto(e, 'principale')} />
                  <p className="mt-2 truncate text-xs text-ardoise">{nomPhoto || 'JPG, PNG ou WebP · 3 Mo maximum'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={enregistrer} className="btn-primaire">
              {coach ? 'Enregistrer les modifications' : 'Créer le profil'}
            </button>
            <button type="button" onClick={onClose} className="btn-fantome">
              Fermer
            </button>
            {enregistre && (
              <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-prune">
                <Check size={15} aria-hidden="true" />
                Modifications enregistrées
              </span>
            )}
          </div>

          {/* ---- Médias (uniquement sur un profil existant) ---- */}
          {courant ? (
            <section aria-labelledby="titre-medias" className="mt-10 border-t border-brume pt-8">
              <h3 id="titre-medias" className="font-display text-xl text-encre">
                Médias ({courant.media.length})
              </h3>

              {courant.media.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {courant.media.map((m: Media) => (
                    <li key={m.id} className="group relative overflow-hidden rounded-2xl border border-brume">
                      <div className="relative aspect-square bg-brume">
                        <Image
                          src={m.kind === 'video' ? m.poster ?? m.url : m.url}
                          alt={m.title}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-encre/90 to-transparent p-2.5">
                        <p className="truncate text-[0.68rem] font-medium text-white">{m.title}</p>
                        <p className="flex items-center gap-1 text-[0.62rem] text-white/70">
                          {m.locked ? <Lock size={9} aria-hidden="true" /> : <Unlock size={9} aria-hidden="true" />}
                          {m.kind === 'video' ? 'Vidéo' : 'Photo'}
                          {m.locked && ` · ${m.price} cr.`}
                        </p>
                      </div>
                      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        {m.kind === 'image' && (
                          <button
                            type="button"
                            onClick={() => setMainPhoto(courant.id, m.url)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-prune shadow"
                            aria-label={`Définir « ${m.title} » comme photo principale`}
                            title="Définir comme photo principale"
                          >
                            <Star size={12} fill={courant.mainPhoto === m.url ? 'currentColor' : 'none'} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void supprimerMedia(m)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-rose shadow"
                          aria-label={`Supprimer « ${m.title} »`}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 rounded-3xl border border-brume bg-porcelaine p-5">
                <p className="eyebrow">Ajouter un média</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="m-kind" className="etiquette">Type</label>
                    <select id="m-kind" className="champ" value={mKind} onChange={(e) => changerTypeMedia(e.target.value as MediaKind)}>
                      <option value="image">Photo</option>
                      <option value="video">Vidéo</option>
                    </select>
                  </div>
                  {mKind === 'image' ? (
                    <div className="sm:col-span-2">
                      <span className="etiquette">Fichier photo</span>
                      <label htmlFor="m-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-prune/40 bg-white px-4 py-5 text-sm font-semibold text-prune transition-colors hover:bg-lilas/30">
                        <Upload size={16} aria-hidden="true" />
                        {nomMedia || 'Choisir une photo sur votre poste'}
                      </label>
                      <input id="m-file" type="file" accept="image/*" className="sr-only" onChange={(e) => void chargerPhoto(e, 'media')} />
                    </div>
                  ) : (
                    <div>
                      <span className="etiquette">Fichier vidéo</span>
                      <label htmlFor="m-video" className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-prune/40 bg-white px-4 py-5 text-sm font-semibold text-prune transition-colors hover:bg-lilas/30">
                        <Upload size={16} aria-hidden="true" />
                        <span className="truncate">{nomMedia || 'Choisir une vidéo sur votre poste'}</span>
                      </label>
                      <input id="m-video" type="file" accept="video/*" className="sr-only" onChange={(e) => void chargerVideo(e)} />
                    </div>
                  )}
                  {mKind === 'video' && (
                    <div>
                      <span className="etiquette">Vignette de la vidéo</span>
                      <label htmlFor="m-poster" className="champ flex cursor-pointer items-center gap-2 text-ardoise">
                        <Upload size={15} aria-hidden="true" />
                        <span className="truncate">{nomPoster || 'Choisir une photo'}</span>
                      </label>
                      <input id="m-poster" type="file" accept="image/*" className="sr-only" onChange={(e) => void chargerPhoto(e, 'poster')} />
                    </div>
                  )}
                  <div className="flex items-end gap-4 sm:col-span-2">
                    <label className="flex items-center gap-2.5 text-sm text-encre">
                      <input type="checkbox" checked={mLocked} onChange={(e) => setMLocked(e.target.checked)} className="h-4 w-4 rounded border-brume text-prune focus:ring-prune" />
                      Contenu premium
                    </label>
                    {mLocked && (
                      <div className="w-32">
                        <label htmlFor="m-price" className="etiquette">Prix (€)</label>
                        <input id="m-price" type="number" min={0} className="champ tabulaire" value={mPrice} onChange={(e) => setMPrice(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>

                <button type="button" onClick={ajouterMedia} className="btn-secondaire mt-5" disabled={televersement}>
                  <ImagePlus size={15} aria-hidden="true" />
                  Ajouter le média
                </button>

                <p className="mt-3 text-xs leading-relaxed text-ardoise">
                  {televersement
                    ? 'Envoi sécurisé vers Supabase en cours…'
                    : 'Import vers Supabase Storage : 3 Mo maximum par photo et 25 Mo par vidéo.'}
                </p>
              </div>
            </section>
          ) : (
            <p className="mt-8 rounded-3xl border border-dashed border-brume p-6 text-center text-sm text-ardoise">
              Créez d’abord le profil : la gestion des médias s’ouvrira ensuite.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
