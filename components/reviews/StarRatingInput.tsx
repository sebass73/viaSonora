"use client"

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** Interactive 1-5 star input used to submit a rating. */
export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered ?? value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`${star}`}
            aria-checked={value === star}
            role="radio"
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
