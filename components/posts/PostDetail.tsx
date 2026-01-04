"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { RequestForm } from '@/components/requests/RequestForm';
import { ReportPostDialog } from '@/components/reports/ReportPostDialog';
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
      nameEs: string;
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
    addressText?: string;
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

const conditionLabels: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  FAIR: 'Regular',
  POOR: 'Malo',
};

export function PostDetail() {
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
        alert('Post no encontrado');
        router.push('/explore');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Error al cargar el post');
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
  
  // Estados de solicitud
  const requestStatusLabels: Record<string, string> = {
    REQUESTED: 'Pendiente',
    ACCEPTED: 'Aceptada',
    DECLINED: 'Rechazada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
  };
  
  const requestStatusColors: Record<string, string> = {
    REQUESTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
    DECLINED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  if (loading) {
    return <div className="container py-8">Cargando...</div>;
  }

  if (!post) {
    return <div className="container py-8">Post no encontrado</div>;
  }

  return (
    <div className="container py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        ← Volver
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{post.instrument.title}</CardTitle>
              <CardDescription>
                {post.instrument.category.nameEs} • {(() => {
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
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{post.instrument.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {post.instrument.brand && (
                    <div>
                      <h4 className="font-semibold text-sm">Marca</h4>
                      <p className="text-muted-foreground">{post.instrument.brand}</p>
                    </div>
                  )}
                  {post.instrument.model && (
                    <div>
                      <h4 className="font-semibold text-sm">Modelo</h4>
                      <p className="text-muted-foreground">{post.instrument.model}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">Condición</h4>
                    <p className="text-muted-foreground">
                      {conditionLabels[post.instrument.condition] || post.instrument.condition}
                    </p>
                  </div>
                </div>

                {post.instrument.extras && (
                  <div>
                    <h3 className="font-semibold mb-2">Extras / Accesorios</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{post.instrument.extras}</p>
                  </div>
                )}

                {post.instrument.availability && post.instrument.availability.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Disponibilidad</h3>
                    <div className="space-y-2">
                      {post.instrument.availability.map((avail, index) => {
                        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="font-medium w-24">{days[avail.dayOfWeek]}:</span>
                            <span className="text-muted-foreground">
                              {avail.startTime} - {avail.endTime}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Los usuarios deberán coordinar la gestión del instrumento directamente contigo.
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
              <CardTitle>Propietario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {post.owner.image && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={post.owner.image}
                      alt={post.owner.name || 'Usuario'}
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
                      <h4 className="font-semibold text-sm mb-1">Email</h4>
                      <a href={`mailto:${post.owner.email}`} className="text-primary hover:underline">
                        {post.owner.email}
                      </a>
                    </div>
                  )}
                  {post.owner.phone && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Teléfono</h4>
                      <a href={`tel:${post.owner.phone}`} className="text-primary hover:underline">
                        {post.owner.phone}
                      </a>
                    </div>
                  )}
                  {post.owner.whatsappUrl && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">WhatsApp</h4>
                      <Link href={post.owner.whatsappUrl} target="_blank" className="text-primary hover:underline">
                        Contactar por WhatsApp
                      </Link>
                    </div>
                  )}
                  {post.owner.addressText && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Dirección</h4>
                      <p className="text-muted-foreground">{post.owner.addressText}</p>
                    </div>
                  )}
                  {post.owner.locationText && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Zona/Barrio</h4>
                      <p className="text-muted-foreground">{post.owner.locationText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {userRequest ? (
                    <div className={`border p-4 rounded-lg ${requestStatusColors[userRequest.status] || 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">Estado de tu solicitud:</p>
                        <Badge className={requestStatusColors[userRequest.status] || 'bg-gray-100 text-gray-800'}>
                          {requestStatusLabels[userRequest.status] || userRequest.status}
                        </Badge>
                      </div>
                      {userRequest.status === 'REQUESTED' && (
                        <p className="text-sm">
                          Tu solicitud está pendiente de respuesta. El propietario recibirá una notificación y te responderá pronto.
                        </p>
                      )}
                      {userRequest.status === 'ACCEPTED' && (
                        <p className="text-sm">
                          ¡Tu solicitud ha sido aceptada! El contacto del propietario se muestra arriba. Puedes contactarlo ahora.
                        </p>
                      )}
                      {userRequest.status === 'DECLINED' && (
                        <p className="text-sm">
                          Tu solicitud fue rechazada por el propietario. Puedes intentar con otro instrumento o contactar al propietario directamente si tienes otra forma de comunicación.
                        </p>
                      )}
                      {userRequest.status === 'CANCELLED' && (
                        <p className="text-sm">
                          Has cancelado esta solicitud. Si cambias de opinión, puedes enviar una nueva solicitud.
                        </p>
                      )}
                      {userRequest.status === 'COMPLETED' && (
                        <p className="text-sm">
                          Esta solicitud ha sido marcada como completada.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted p-4 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground">
                          Para contactar al propietario, debes enviar una solicitud y esperar su aprobación.
                        </p>
                      </div>
                      {session ? (
                        !showRequestForm ? (
                          <Button className="w-full" onClick={() => setShowRequestForm(true)}>
                            Enviar Solicitud
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
                          <Button className="w-full">Iniciar sesión para enviar solicitud</Button>
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

