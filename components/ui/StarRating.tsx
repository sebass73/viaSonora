import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  outOf?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Read-only star display for an already-computed rating. */
export function StarRating({ rating, outOf = 5, size = 'md', className }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const rounded = Math.round(rating);

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={`${rating} / ${outOf}`}>
      {Array.from({ length: outOf }, (_, index) => (
        <Star
          key={index}
          className={cn(
            sizeClass,
            index < rounded ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}
