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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface ReportPostDialogProps {
  postId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ReportPostDialog({ postId, trigger, onSuccess }: ReportPostDialogProps) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      setError(t('reasonRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          reason,
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
        setReason('');
        setComment('');
        setSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      setOpen(false);
      setReason('');
      setComment('');
      setError(null);
      setSuccess(false);
    } else {
      setOpen(newOpen);
    }
  };

  const reasonLabels: Record<string, string> = {
    SPAM: t('reasonSpam'),
    INAPPROPRIATE: t('reasonInappropriate'),
    FAKE: t('reasonFake'),
    INCORRECT_INFO: t('reasonIncorrectInfo'),
    OTHER: t('reasonOther'),
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {tCommon('report')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-4 text-center">
            <p className="text-green-600 font-medium">{t('successTitle')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('successMessage')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reason">{t('reason')} *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder={t('reasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">{reasonLabels.SPAM}</SelectItem>
                  <SelectItem value="INAPPROPRIATE">{reasonLabels.INAPPROPRIATE}</SelectItem>
                  <SelectItem value="FAKE">{reasonLabels.FAKE}</SelectItem>
                  <SelectItem value="INCORRECT_INFO">{reasonLabels.INCORRECT_INFO}</SelectItem>
                  <SelectItem value="OTHER">{reasonLabels.OTHER}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment">{t('comment')}</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('commentPlaceholder')}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {comment.length}/1000 {t('commentCharacters')}
              </p>
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

