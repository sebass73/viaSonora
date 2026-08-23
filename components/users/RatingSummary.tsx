import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/StarRating';

interface RatingBucket {
  average: number | null;
  reviewCount: number;
  completedLoans: number;
}

interface RatingSummaryProps {
  ratings: {
    overall: RatingBucket;
    asLender: RatingBucket;
    asReturner: RatingBucket;
  };
}

function RatingCard({
  title,
  bucket,
  emptyMessage,
  unratedMessage,
  ratedSummary,
}: {
  title: string;
  bucket: RatingBucket;
  emptyMessage: string;
  unratedMessage: string;
  ratedSummary: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {bucket.completedLoans === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : bucket.reviewCount === 0 ? (
          <p className="text-sm text-muted-foreground">{unratedMessage}</p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StarRating rating={bucket.average ?? 0} />
              <span className="font-semibold">{bucket.average?.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ratedSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Three breakdown cards resolving the no-activity / completed-unrated / rated states. */
export function RatingSummary({ ratings }: RatingSummaryProps) {
  const t = useTranslations('publicProfile');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <RatingCard
        title={t('overallTitle')}
        bucket={ratings.overall}
        emptyMessage={t('noCompletedLoansOverall')}
        unratedMessage={t('completedNoRatings', { count: ratings.overall.completedLoans })}
        ratedSummary={t('ratedSummary', {
          reviewCount: ratings.overall.reviewCount,
          completedLoans: ratings.overall.completedLoans,
        })}
      />
      <RatingCard
        title={t('asLenderTitle')}
        bucket={ratings.asLender}
        emptyMessage={t('noCompletedLoansLender')}
        unratedMessage={t('completedNoRatings', { count: ratings.asLender.completedLoans })}
        ratedSummary={t('ratedSummary', {
          reviewCount: ratings.asLender.reviewCount,
          completedLoans: ratings.asLender.completedLoans,
        })}
      />
      <RatingCard
        title={t('asReturnerTitle')}
        bucket={ratings.asReturner}
        emptyMessage={t('noCompletedLoansReturner')}
        unratedMessage={t('completedNoRatings', { count: ratings.asReturner.completedLoans })}
        ratedSummary={t('ratedSummary', {
          reviewCount: ratings.asReturner.reviewCount,
          completedLoans: ratings.asReturner.completedLoans,
        })}
      />
    </div>
  );
}
