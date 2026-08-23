"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/StarRating';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  subjectRole: 'LENDER' | 'RETURNER';
  reply: string | null;
  repliedAt: string | null;
  author: {
    id: string;
    name: string | null;
    lastName: string | null;
    image: string | null;
  };
}

interface ReviewItemProps {
  review: Review;
  canReply: boolean;
  onReplied: () => void;
}

function ReviewItem({ review, canReply, onReplied }: ReviewItemProps) {
  const t = useTranslations('reviews');
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: es });

  const handleSubmitReply = async () => {
    if (!reply.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: reply.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('replyError'));
      }
      setReplying(false);
      onReplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('replyError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Link href={`/users/${review.author.id}`} className="font-semibold hover:underline">
          {review.author.name} {review.author.lastName}
        </Link>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <StarRating rating={review.rating} size="sm" />
      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}

      {review.reply !== null ? (
        <div className="mt-2 pl-4 border-l-2 border-muted">
          <p className="text-xs font-semibold text-muted-foreground">{t('replyLabel')}</p>
          <p className="text-sm">{review.reply}</p>
        </div>
      ) : canReply ? (
        replying ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t('replyPlaceholder')}
              rows={2}
              maxLength={1000}
              disabled={loading}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitReply} disabled={loading}>
                {loading ? t('replySubmitting') : t('replySubmit')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReplying(false)} disabled={loading}>
                {t('replyCancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setReplying(true)}>
            {t('replyAction')}
          </Button>
        )
      ) : null}
    </div>
  );
}

interface ReviewListProps {
  reviews: Review[];
  currentUserId: string | null;
  profileUserId: string;
  onReplied: () => void;
}

/** Lists individual reviews received by the profile's user. */
export function ReviewList({ reviews, currentUserId, profileUserId, onReplied }: ReviewListProps) {
  const t = useTranslations('publicProfile');
  const viewerIsSubject = currentUserId === profileUserId;

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noReviews')}</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          canReply={viewerIsSubject && review.reply === null}
          onReplied={onReplied}
        />
      ))}
    </div>
  );
}
