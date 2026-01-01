"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Ban, Eye } from 'lucide-react';

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
          nameEs: string;
        };
      };
    };
    instrument: {
      id: string;
      title: string;
      photos: Array<{ url: string }>;
      category: {
        nameEs: string;
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
}

const statusLabels: Record<string, string> = {
  REQUESTED: 'Pendiente',
  ACCEPTED: 'Aceptada',
  DECLINED: 'Rechazada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export function RequestCard({ request, currentUserId, onStatusChange }: RequestCardProps) {
  const isOwner = request.owner.id === currentUserId;
  const isClient = request.client.id === currentUserId;

  const formattedFromDate = format(new Date(request.fromDate), 'dd/MM/yyyy, HH:mm', { locale: es });
  const formattedToDate = format(new Date(request.toDate), 'dd/MM/yyyy, HH:mm', { locale: es });
  const formattedCreatedAt = format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es });

  const canAccept = isOwner && request.status === 'REQUESTED';
  const canDecline = isOwner && request.status === 'REQUESTED';
  const canCancel = isClient && (request.status === 'REQUESTED' || request.status === 'ACCEPTED');
  const canComplete = isOwner && request.status === 'ACCEPTED';

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;

    if (confirm(`¿Estás seguro de cambiar el estado a "${statusLabels[newStatus]}"?`)) {
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
                  {request.instrument.category.nameEs} • {request.post.city}
                  {request.post.areaText && `, ${request.post.areaText}`}
                </p>
              </div>
              <Badge className={statusColors[request.status] || 'bg-gray-100 text-gray-800'}>
                {statusLabels[request.status] || request.status}
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-semibold">Usuario:</span>{' '}
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
              <div>
                <span className="font-semibold">Desde:</span> {formattedFromDate}
              </div>
              <div>
                <span className="font-semibold">Hasta:</span> {formattedToDate}
              </div>
              <div>
                <span className="font-semibold">Enviada:</span> {formattedCreatedAt}
              </div>
              {request.message && (
                <div>
                  <span className="font-semibold">Mensaje:</span>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{request.message}</p>
                </div>
              )}
              {request.accessories && (
                <div>
                  <span className="font-semibold">Accesorios:</span>
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
                <Check className="mr-2 h-4 w-4" /> Aceptar
              </Button>
            )}
            {canDecline && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('DECLINED')}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                <X className="mr-2 h-4 w-4" /> Rechazar
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('CANCELLED')}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                <Ban className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            )}
            {canComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('COMPLETED')}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Check className="mr-2 h-4 w-4" /> Marcar como Completada
              </Button>
            )}
            <Link href={`/posts/${request.post.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" /> Ver Post
              </Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}


