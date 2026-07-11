import { Icon } from '@/components/ui/Icon';

export function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }} role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={size} color={i < Math.round(rating) ? '#FFB020' : 'var(--color-border)'} />
      ))}
    </div>
  );
}
