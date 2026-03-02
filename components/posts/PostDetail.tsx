"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { RequestForm } from '@/components/requests/RequestForm';
import { ReportPostDialog } from '@/components/reports/ReportPostDialog';
import { CategoryName } from '@/components/CategoryName';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string;
  ownerId: string;
  city: string;
  areaText: string | null;
  status: string;
  expiresAt: string;
  instrument: {
    id: string;
    title: string;
    description: string;
    brand: string | null;
    model: string | null;
    condition: string;
    extras: string | null;
    photos: Array<{ url: string }>;
    category: {
      slug: string;
    };
    locations: Array<{
      city: string;
      areaText: string | null;
      lat: number;
      lng: number;
    }>;
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
    owner: {
      id: string;
      name: string | null;
      lastName: string | null;
      image: string | null;
    };
  };
  owner: {
    id: string;
    name: string | null;
    lastName: string | null;
    image: string | null;
    email?: string;
    phone?: string;
    whatsappUrl?: string;
    city?: string | null;
    country?: string | null;
    locationText?: string | null;
    lat?: number;
    lng?: number;
  };
  acceptedRequest?: {
    id: string;
    status: string;
  } | null;
  userRequest?: {
    id: string;
    status: string;
    createdAt: string;
  } | null;
}

const conditionKeys: Record<string, string> = {
  EXCELLENT: 'conditionExcellent',
  GOOD: 'conditionGood',
  FAIR: 'conditionFair',
  POOR: 'conditionPoor',
};

export function PostDetail() {
  const t = useTranslations('common');
  const tPosts = useTranslations('posts');
  const tRequests = useTranslations('requests');
  const tInstruments = useTranslations('instruments');
  const tProfile = useTranslations('profile');
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        alert(t('postNotFound'));
        router.push('/explore');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert(t('errorLoadingPost'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    setShowRequestForm(false);
    fetchPost(); // Recargar el post para mostrar el estado actualizado
  };

  const isOwner = post && session?.user?.id === post.ownerId;
  const hasAcceptedRequest = post?.acceptedRequest?.status === 'ACCEPTED';
  const showContact = isOwner || hasAcceptedRequest;
  const userRequest = post?.userRequest;
  
  const requestStatusKeys: Record<string, string> = {
    REQUESTED: 'statusRequested',
    ACCEPTED: 'statusAccepted',
    DECLINED: 'statusDeclined',
    CANCELLED: 'statusCancelled',
    COMPLETED: 'statusCompleted',
  };
  const requestStatusColors: Record<string, string> = {
    REQUESTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
    DECLINED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  if (loading) {
    return <div className="container py-8">{t('loading')}</div>;
  }

  if (!post) {
    return <div className="container py-8">{t('postNotFound')}</div>;
  }

  return (
    <div className="container py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        ← {t('back')}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{post.instrument.title}</CardTitle>
              <CardDescription>
                <CategoryName category={post.instrument.category} /> • {(() => {
                  // Extraer solo la ciudad de la dirección completa (antes de la primera coma)
                  const cityOnly = post.city.split(',')[0].trim();
                  return cityOnly;
                })()}
                {post.areaText && `, ${post.areaText}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {post.instrument.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {post.instrument.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={`${post.instrument.title} - Foto ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{tPosts('descriptionSection')}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{post.instrument.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {post.instrument.brand && (
                    <div>
                      <h4 className="font-semibold text-sm">{tInstruments('brandLabel')}</h4>
                      <p className="text-muted-foreground">{post.instrument.brand}</p>
                    </div>
                  )}
                  {post.instrument.model && (
                    <div>
                      <h4 className="font-semibold text-sm">{tInstruments('modelLabel')}</h4>
                      <p className="text-muted-foreground">{post.instrument.model}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">{tInstruments('conditionLabel')}</h4>
                    <p className="text-muted-foreground">
                      {conditionKeys[post.instrument.condition] ? tInstruments(conditionKeys[post.instrument.condition]) : post.instrument.condition}
                    </p>
                  </div>
                </div>

                {post.instrument.extras && (
                  <div>
                    <h3 className="font-semibold mb-2">{tPosts('extrasAccessories')}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{post.instrument.extras}</p>
                  </div>
                )}

                {post.instrument.availability && post.instrument.availability.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">{tPosts('availabilitySection')}</h3>
                    <div className="space-y-2">
                      {post.instrument.availability.map((avail, index) => {
                        const dayKeys = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="font-medium w-24">{tInstruments(dayKeys[avail.dayOfWeek] as keyof typeof dayKeys)}:</span>
                            <span className="text-muted-foreground">
                              {avail.startTime} - {avail.endTime}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tPosts('availabilityCoordinateHint')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tPosts('owner')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {post.owner.image && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={post.owner.image}
                      alt={post.owner.name || tRequests('userLabel')}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {post.owner.name} {post.owner.lastName}
                  </p>
                </div>
              </div>

              {showContact ? (
                <div className="space-y-3">
                  {post.owner.email && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{t('email')}</h4>
                      <a href={`mailto:${post.owner.email}`} className="text-primary hover:underline">
                        {post.owner.email}
                      </a>
                    </div>
                  )}
                  {post.owner.phone && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{tProfile('phone')}</h4>
                      <a href={`tel:${post.owner.phone}`} className="text-primary hover:underline">
                        {post.owner.phone}
                      </a>
                    </div>
                  )}
                  {post.owner.whatsappUrl && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">WhatsApp</h4>
                      <Link href={post.owner.whatsappUrl} target="_blank" className="text-primary hover:underline">
                        {tPosts('contactWhatsApp')}
                      </Link>
                    </div>
                  )}
                  {(post.owner.city || post.owner.country) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{tPosts('addressLabel')}</h4>
                      <p className="text-muted-foreground">
                        {[post.owner.city, post.owner.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {post.owner.locationText && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{tProfile('zoneLabel')}</h4>
                      <p className="text-muted-foreground">{post.owner.locationText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {userRequest ? (
                    <div className={`border p-4 rounded-lg ${requestStatusColors[userRequest.status] || 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">{tPosts('requestStatusLabel')}</p>
                        <Badge className={requestStatusColors[userRequest.status] || 'bg-gray-100 text-gray-800'}>
                          {requestStatusKeys[userRequest.status] ? tRequests(requestStatusKeys[userRequest.status]) : userRequest.status}
                        </Badge>
                      </div>
                      {userRequest.status === 'REQUESTED' && (
                        <p className="text-sm">
                          {tPosts('requestPendingMessage')}
                        </p>
                      )}
                      {userRequest.status === 'ACCEPTED' && (
                        <p className="text-sm">
                          {tPosts('requestAcceptedMessage')}
                        </p>
                      )}
                      {userRequest.status === 'DECLINED' && (
                        <p className="text-sm">
                          {tPosts('requestDeclinedMessage')}
                        </p>
                      )}
                      {userRequest.status === 'CANCELLED' && (
                        <p className="text-sm">
                          {tPosts('requestCancelledMessage')}
                        </p>
                      )}
                      {userRequest.status === 'COMPLETED' && (
                        <p className="text-sm">
                          {tPosts('requestCompletedMessage')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted p-4 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground">
                          {tPosts('contactOwnerHint')}
                        </p>
                      </div>
                      {session ? (
                        !showRequestForm ? (
                          <Button className="w-full" onClick={() => setShowRequestForm(true)}>
                            {tPosts('sendRequest')}
                          </Button>
                        ) : (
                          <RequestForm 
                            postId={post.id} 
                            instrumentId={post.instrument.id}
                            availability={post.instrument.availability || []}
                            onSuccess={handleRequestSuccess} 
                          />
                        )
                      ) : (
                        <Link href="/login">
                          <Button className="w-full">{tPosts('loginToSendRequest')}</Button>
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Botón de reportar (solo si no es el owner y está autenticado) */}
              {session && !isOwner && (
                <div className="mt-4 pt-4 border-t">
                  <ReportPostDialog postId={post.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

