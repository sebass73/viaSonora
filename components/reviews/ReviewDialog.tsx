"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StarRatingInput } from '@/components/reviews/StarRatingInput';
import { AlertCircle } from 'lucide-react';

interface ReviewDialogProps {
  requestId: string;
  children: React.ReactNode;
  onSubmitted?: () => void;
}

/** Dismissible, fully optional rating dialog for a COMPLETED request. */
export function ReviewDialog({ requestId, children, onSubmitted }: ReviewDialogProps) {
  const t = useTranslations('reviews');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      setOpen(false);
      resetState();
    } else {
      setOpen(newOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      setError(t('ratingRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetState();
        onSubmitted?.();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center">
            <p className="text-green-600 font-medium">{t('success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('ratingLabel')}</Label>
              <div className="mt-2">
                <StarRatingInput value={rating} onChange={setRating} disabled={loading} />
              </div>
            </div>

            <div>
              <Label htmlFor="review-comment">{t('commentLabel')}</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('commentPlaceholder')}
                rows={4}
                maxLength={1000}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('submitting') : t('submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
