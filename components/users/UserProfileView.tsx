"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingSummary } from '@/components/users/RatingSummary';
import { ReviewList } from '@/components/users/ReviewList';
import { ShareButton } from '@/components/ui/share-button';

interface ProfileResponse {
  user: {
    id: string;
    name: string | null;
    lastName: string | null;
    image: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    memberSince: string;
  };
  ratings: {
    overall: { average: number | null; reviewCount: number; completedLoans: number };
    asLender: { average: number | null; reviewCount: number; completedLoans: number };
    asReturner: { average: number | null; reviewCount: number; completedLoans: number };
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    subjectRole: 'LENDER' | 'RETURNER';
    reply: string | null;
    repliedAt: string | null;
    author: { id: string; name: string | null; lastName: string | null; image: string | null };
  }>;
}

export function UserProfileView() {
  const params = useParams();
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations('publicProfile');
  const tCommon = useTranslations('common');
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const userId = params?.id as string;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  if (loading) {
    return <div className="container py-8">{tCommon('loading')}</div>;
  }

  if (notFound || !profile) {
    return <div className="container py-8">{t('userNotFound')}</div>;
  }

  const { user, ratings, reviews } = profile;
  const memberSince = format(new Date(user.memberSince), 'MMMM yyyy', { locale: es });
  const location = [user.city, user.state, user.country].filter(Boolean).join(', ');

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          {user.image && (
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {user.name} {user.lastName}
            </h1>
            {location && <p className="text-sm text-muted-foreground">{location}</p>}
            <p className="text-xs text-muted-foreground">{t('memberSince', { date: memberSince })}</p>
          </div>
          <ShareButton
            url={`/${locale}/users/${user.id}`}
            title={[user.name, user.lastName].filter(Boolean).join(' ')}
          />
        </CardContent>
      </Card>

      <RatingSummary ratings={ratings} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reviewsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewList
            reviews={reviews}
            currentUserId={session?.user?.id ?? null}
            profileUserId={user.id}
            onReplied={fetchProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
