"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface Post {
  id: string;
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
  };
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
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
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
                {post.instrument.category.nameEs} • {post.city}
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
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

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Para contactar al propietario, debes enviar una solicitud y esperar su aprobación.
                </p>
              </div>

              <Button className="w-full mt-4" disabled>
                Enviar Solicitud (Próximamente)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

