import { Star } from 'lucide-react';

interface Props {
  value: number;
  size?: number;
  showValue?: boolean;
  reviews?: number;
}

/** Note visuelle en étoiles, avec demi-étoile via un masque de largeur. */
export default function Stars({ value, size = 15, showValue = true, reviews }: Props) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative inline-flex"
        role="img"
        aria-label={`Note de ${clamped.toFixed(1)} sur 5`}
      >
        <div className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} className="text-brume" fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={size}
              className="shrink-0 text-or"
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </div>
      </div>
      {showValue && (
        <span className="tabulaire text-sm font-semibold text-encre">{clamped.toFixed(1)}</span>
      )}
      {typeof reviews === 'number' && (
        <span className="text-sm text-ardoise">({reviews} avis)</span>
      )}
    </div>
  );
}
