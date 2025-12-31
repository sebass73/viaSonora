"use client"

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapView } from '@/components/map/MapView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';

// Dynamic import para evitar problemas de SSR con Leaflet
const MapViewDynamic = dynamic(() => import('@/components/map/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[500px] bg-gray-200 animate-pulse rounded-lg" />
});

interface Post {
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
    locations: Array<{
      lat: number;
      lng: number;
    }>;
  };
}

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchCity) params.set('city', searchCity);
      if (searchText) params.set('search', searchText);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchPosts();
  };

  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleViewDetails = () => {
    if (selectedPost) {
      router.push(`/posts/${selectedPost.id}`);
    }
  };

  // Calcular centro del mapa basado en posts
  const mapCenter: [number, number] = posts.length > 0 && posts[0].instrument.locations?.[0]
    ? [posts[0].instrument.locations[0].lat, posts[0].instrument.locations[0].lng]
    : [-34.6037, -58.3816]; // Buenos Aires por defecto

  return (
    <div className="flex flex-col h-screen">
      {/* Barra de búsqueda sticky */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Ciudad..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Buscar instrumento..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </div>
      </div>

      {/* Mapa - más del 50% de altura visible */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        ) : (
          <MapViewDynamic
            posts={posts}
            center={mapCenter}
            zoom={13}
            onMarkerClick={handleMarkerClick}
          />
        )}

        {/* Card de preview cuando se selecciona un pin */}
        {selectedPost && (
          <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {selectedPost.instrument.photos[0] && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedPost.instrument.photos[0].url}
                        alt={selectedPost.instrument.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{selectedPost.instrument.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPost.instrument.category.nameEs}</p>
                    <p className="text-sm text-muted-foreground">{selectedPost.city}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={handleViewDetails}
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
