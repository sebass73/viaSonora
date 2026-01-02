"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapView } from '@/components/map/MapView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryChips } from '@/components/CategoryChips';
import { InstrumentAutocomplete } from '@/components/InstrumentAutocomplete';

// Dynamic import para evitar problemas de SSR con Leaflet
const MapViewDynamic = dynamic(() => import('@/components/map/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
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
      id: string;
      nameEs: string;
    };
    locations: Array<{
      lat: number;
      lng: number;
    }>;
  };
}

interface Category {
  id: string;
  nameEs: string;
}

export default function HomePage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTitle) params.set('search', searchTitle);
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
      params.set('pageSize', '12');

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setPosts(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTitle, selectedCategoryId]);

  // Cargar posts cuando cambia la categoría seleccionada (solo si no hay búsqueda activa)
  useEffect(() => {
    if (!searchTitle) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  // Cargar posts iniciales
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleRequest = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const element = carouselRef.current;
      const scrollAmount = 300; // Ancho aproximado de una card + gap
      const currentScroll = element.scrollLeft;
      const maxScroll = element.scrollWidth - element.clientWidth;
      
      let targetScroll: number;
      
      if (direction === 'right') {
        // Si estamos cerca del final (dentro de 50px), volver al inicio
        if (currentScroll >= maxScroll - 50) {
          targetScroll = 0;
        } else {
          targetScroll = currentScroll + scrollAmount;
        }
      } else {
        // Si estamos cerca del inicio (dentro de 50px), ir al final
        if (currentScroll <= 50) {
          targetScroll = maxScroll;
        } else {
          targetScroll = currentScroll - scrollAmount;
        }
      }
      
      element.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Calcular centro del mapa basado en posts
  const mapCenter: [number, number] = posts.length > 0 && posts[0].instrument.locations?.[0]
    ? [posts[0].instrument.locations[0].lat, posts[0].instrument.locations[0].lng]
    : [-34.6037, -58.3816]; // Buenos Aires por defecto

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sección de búsqueda */}
      <div className="bg-background border-b flex-shrink-0">
        <div className="container py-2 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[150px] md:min-w-[200px]">
              <Input
                placeholder={t('searchByTitle')}
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full"
              />
              <InstrumentAutocomplete
                searchQuery={searchTitle}
                onSelect={(postId) => {
                  router.push(`/posts/${postId}`);
                  setSearchTitle(''); // Limpiar búsqueda después de seleccionar
                }}
              />
            </div>
            {/* Botón Buscar solo visible en desktop */}
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-primary hidden md:inline-flex flex-1 sm:flex-initial"
            >
              {loading ? t('searching') : t('search')}
            </Button>
            {session && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/posts/new')}
                className="flex-1 sm:flex-initial"
              >
                {t('addNew')}
              </Button>
            )}
          </form>
          
          {/* Chips de categorías */}
          <CategoryChips
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            locale={locale}
          />
        </div>
      </div>

      {/* Contenedor principal: Cards + Mapa */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Sección de cards de instrumentos - espacio mínimo necesario */}
        <div className="flex-shrink-0 overflow-hidden relative" style={{ minHeight: '180px', maxHeight: '220px' }}>
          <div className="container py-2 h-full flex items-center px-4 md:px-6">
            {posts.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 md:left-6 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={() => scrollCarousel('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {loading ? (
              <div className="w-full flex gap-2 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse flex-shrink-0 w-[180px] md:w-[200px]">
                    <div className="w-full h-20 bg-gray-200 rounded-t-lg" />
                    <CardHeader className="p-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <div className="h-6 bg-gray-200 rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="w-full">
                <CardContent className="py-6 text-center">
                  <p className="text-muted-foreground text-sm">{t('noInstrumentsFound')}</p>
                </CardContent>
              </Card>
            ) : (
              <div 
                ref={carouselRef}
                className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide snap-x snap-mandatory w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {posts.map((post) => {
                  // Extraer solo la ciudad de la dirección completa (antes de la primera coma o el primer número)
                  const cityOnly = post.city.split(',')[0].trim();
                  
                  return (
                    <Card key={post.id} className="overflow-hidden flex-shrink-0 w-[180px] md:w-[200px] snap-start">
                      {post.instrument.photos[0] && (
                        <div className="relative w-full h-20">
                          <Image
                            src={post.instrument.photos[0].url}
                            alt={post.instrument.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="p-2">
                        <CardTitle className="text-xs font-semibold line-clamp-1 leading-tight">{post.instrument.title}</CardTitle>
                        <CardDescription className="text-xs leading-tight mt-1">
                          {cityOnly}
                        </CardDescription>
                        <CardDescription className="text-xs leading-tight">
                          {post.instrument.category.nameEs}
                        </CardDescription>
                      </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <Button
                        size="sm"
                        className="w-full text-xs h-6"
                        onClick={() => handleRequest(post.id)}
                      >
                        {t('request')}
                      </Button>
                    </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {posts.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 md:right-6 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={() => scrollCarousel('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mapa en la parte inferior - ocupa el resto del espacio */}
        <div className="flex-1 min-h-0 border-t">
          {!loading && (
            <MapViewDynamic
              posts={posts}
              center={mapCenter}
              zoom={13}
              onMarkerClick={(post) => handleRequest(post.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
