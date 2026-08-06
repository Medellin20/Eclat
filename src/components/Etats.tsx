import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

/** État de chargement annoncé aux lecteurs d'écran. */
export function Chargement({ label = 'Chargement en cours' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-24 text-ardoise">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Écran vide : toujours une invitation à agir, jamais un simple constat. */
export function Vide({
  titre,
  texte,
  action,
  icone,
}: {
  titre: string;
  texte: string;
  action?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center px-8 py-16 text-center">
      {icone && (
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-3xl bg-rose-wash text-prune">
          {icone}
        </div>
      )}
      <h2 className="font-display text-2xl text-encre">{titre}</h2>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-ardoise">{texte}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

/** Message d'erreur : ce qui s'est passé, et quoi faire ensuite. */
export function Erreur({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-rose-soft/50 bg-rose-wash px-4 py-3 text-sm text-prune-deep"
    >
      {message}
    </p>
  );
}
