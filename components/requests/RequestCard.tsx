"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { Check, X, Ban, Eye } from 'lucide-react';
import { CategoryName } from '@/components/CategoryName';

interface RequestCardProps {
  request: {
    id: string;
    status: string;
    fromDate: string;
    toDate: string;
    message: string;
    accessories: string | null;
    createdAt: string;
    post: {
      id: string;
      city: string;
      areaText: string | null;
      instrument: {
        id: string;
        title: string;
        photos: Array<{ url: string }>;
        category: {
          slug: string;
        };
      };
    };
    instrument: {
      id: string;
      title: string;
      photos: Array<{ url: string }>;
      category: {
        slug: string;
      };
    };
    owner: {
      id: string;
      name: string | null;
      lastName: string | null;
      image: string | null;
    };
    client: {
      id: string;
      name: string | null;
      lastName: string | null;
      image: string | null;
    };
  };
  currentUserId: string;
  onStatusChange?: (requestId: string, newStatus: string) => void;
  availabilityValidationEnabled?: boolean;
}

const statusKeys: Record<string, string> = {
  REQUESTED: 'statusRequested',
  ACCEPTED: 'statusAccepted',
  DECLINED: 'statusDeclined',
  CANCELLED: 'statusCancelled',
  COMPLETED: 'statusCompleted',
};

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export function RequestCard({ request, currentUserId, onStatusChange, availabilityValidationEnabled = false }: RequestCardProps) {
  const tRequests = useTranslations('requests');
  const isOwner = request.owner.id === currentUserId;
  const isClient = request.client.id === currentUserId;

  const getStatusLabel = (status: string) =>
    statusKeys[status] ? tRequests(statusKeys[status]) : status;

  const formattedFromDate = format(new Date(request.fromDate), 'dd/MM/yyyy, HH:mm', { locale: es });
  const formattedToDate = format(new Date(request.toDate), 'dd/MM/yyyy, HH:mm', { locale: es });
  const formattedCreatedAt = format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es });

  const canAccept = isOwner && request.status === 'REQUESTED';
  const canDecline = isOwner && request.status === 'REQUESTED';
  const canCancel = isClient && (request.status === 'REQUESTED' || request.status === 'ACCEPTED');
  const canComplete = isOwner && request.status === 'ACCEPTED';

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    const statusLabel = getStatusLabel(newStatus);
    if (confirm(tRequests('confirmStatusChange', { status: statusLabel }))) {
      onStatusChange(request.id, newStatus);
    }
  };

  return (
    <Card>
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
          {request.instrument.photos.length > 0 && (
            <Image
              src={request.instrument.photos[0].url}
              alt={request.instrument.title}
              fill
              className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
            />
          )}
        </div>
        <CardContent className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <CardTitle className="text-lg">{request.instrument.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  <CategoryName category={request.instrument.category} /> • {request.post.city}
                  {request.post.areaText && `, ${request.post.areaText}`}
                </p>
              </div>
              <Badge className={statusColors[request.status] || 'bg-gray-100 text-gray-800'}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-semibold">{tRequests('userLabel')}:</span>{' '}
                {isOwner ? (
                  <span>
                    {request.client.name} {request.client.lastName}
                  </span>
                ) : (
                  <span>
                    {request.owner.name} {request.owner.lastName}
                  </span>
                )}
              </div>
              {availabilityValidationEnabled && (
                <>
                  <div>
                    <span className="font-semibold">{tRequests('from')}:</span> {formattedFromDate}
                  </div>
                  <div>
                    <span className="font-semibold">{tRequests('to')}:</span> {formattedToDate}
                  </div>
                </>
              )}
              <div>
                <span className="font-semibold">{tRequests('sentAt')}:</span> {formattedCreatedAt}
              </div>
              {request.message && (
                <div>
                  <span className="font-semibold">{tRequests('messageLabel')}:</span>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{request.message}</p>
                </div>
              )}
              {request.accessories && (
                <div>
                  <span className="font-semibold">{tRequests('accessoriesLabel')}:</span>
                  <p className="text-muted-foreground mt-1">{request.accessories}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {canAccept && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('ACCEPTED')}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <Check className="mr-2 h-4 w-4" /> {tRequests('accept')}
              </Button>
            )}
            {canDecline && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('DECLINED')}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                <X className="mr-2 h-4 w-4" /> {tRequests('decline')}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('CANCELLED')}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                <Ban className="mr-2 h-4 w-4" /> {tRequests('cancel')}
              </Button>
            )}
            {canComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('COMPLETED')}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Check className="mr-2 h-4 w-4" /> {tRequests('markCompleted')}
              </Button>
            )}
            <Link href={`/posts/${request.post.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" /> {tRequests('viewPost')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}




