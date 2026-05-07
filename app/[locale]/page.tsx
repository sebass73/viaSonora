"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapView } from '@/components/map/MapView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search, PlusCircle, Lock, MapPin, Info, ShieldCheck, Globe, Users, FileText, Filter, HelpCircle } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { TrustBlock } from '@/components/TrustBlock';
import { CategoryName } from '@/components/CategoryName';
import { CategoryChips } from '@/components/CategoryChips';
import { InstrumentAutocomplete } from '@/components/InstrumentAutocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Dynamic import para evitar problemas de SSR con Leaflet
const MapViewDynamic = dynamic(() => import('@/components/map/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
});

const DEFAULT_MAP_CENTER: [number, number] = [-34.6037, -58.3816]; // Buenos Aires

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
      slug: string;
    };
    locations: Array<{
      lat: number;
      lng: number;
    }>;
  };
}

interface Category {
  id: string;
  slug: string;
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [homeCardsEnabled, setHomeCardsEnabled] = useState(true);
  const [mapFilterOpen, setMapFilterOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : []))
      .then((flags: { key: string; enabled: boolean }[]) => {
        if (cancelled) return;
        const flag = flags.find((f) => f.key === 'HOME_CARDS');
        setHomeCardsEnabled(flag?.enabled ?? true);
      })
      .catch(() => {
        if (!cancelled) setHomeCardsEnabled(true);
      });
    return () => {
      cancelled = true;
    };
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

  // Centro del mapa: primero geolocalización del navegador (precisa), sino IP (API).
  useEffect(() => {
    const applyCenter = (lat: number, lng: number) => {
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setMapCenter([lat, lng]);
      }
    };
    const fallbackToIp = () => {
      fetch('/api/geo')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { lat?: number; lng?: number } | null) => {
          if (data && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
            applyCenter(data.lat!, data.lng!);
          }
        })
        .catch(() => {});
    };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCenter(pos.coords.latitude, pos.coords.longitude),
        fallbackToIp,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      fallbackToIp();
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleRequest = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const handleMarkerClick = (post: any) => {
    setSelectedPost(post as Post);
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      // Focus the main search input when search icon in nav is clicked
      searchInputRef.current?.focus();
    };
    window.addEventListener('openSearch', handler);
    return () => window.removeEventListener('openSearch', handler);
  }, []);

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

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Sección de búsqueda */}
      <div className="bg-background border-b flex-shrink-0">
        <div className="container py-2 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap items-center">
            <div ref={searchPanelRef} className="relative flex-1 min-w-[150px] md:min-w-[200px]">
              <Input
                ref={searchInputRef}
                placeholder={t('searchByTitle')}
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onFocus={() => setSearchPanelOpen(true)}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (searchPanelRef.current?.contains(next)) return;
                  setTimeout(() => setSearchPanelOpen(false), 200);
                }}
                className="w-full pr-12"
              />
              <InstrumentAutocomplete
                searchQuery={searchTitle}
                onSelect={(postId) => {
                  router.push(`/posts/${postId}`);
                  setSearchTitle('');
                  setSearchPanelOpen(false);
                }}
              />

              {/* Panel al enfocar: chips + sugerencias de instrumentos (cuando no hay texto o es corto) */}
              {searchPanelOpen && searchTitle.length < 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-background shadow-lg overflow-hidden">
                  <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('filterByCategory')}</p>
                      <CategoryChips
                        categories={categories}
                        selectedCategoryId={selectedCategoryId}
                        onCategoryChange={setSelectedCategoryId}
                        locale={locale}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('explore')}</p>
                      {loading ? (
                        <p className="text-xs text-muted-foreground py-4">{t('loading')}</p>
                      ) : posts.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4">{t('noInstrumentsFound')}</p>
                      ) : (
                        <div className="grid gap-1.5">
                          {posts.slice(0, 6).map((post) => {
                            const cityOnly = post.city.split(',')[0].trim();
                            return (
                              <Card
                                key={post.id}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => {
                                  router.push(`/posts/${post.id}`);
                                  setSearchPanelOpen(false);
                                }}
                              >
                                <CardContent className="p-2 flex gap-2">
                                  {post.instrument.photos[0] && (
                                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                                      <Image
                                        src={post.instrument.photos[0].url}
                                        alt={post.instrument.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-1">{post.instrument.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      <CategoryName category={post.instrument.category} /> • {cityOnly}
                                      {post.areaText ? `, ${post.areaText}` : ''}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 z-10"
                aria-label={t('search')}
              >
                <Search className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {/* En mobile: botón "Cómo funciona" separado, a la derecha de la barra de búsqueda */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="md:hidden h-9 w-9 flex-shrink-0 text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setHowItWorksOpen(true)}
              aria-label={t('bannerHowItWorks')}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </form>

          {homeCardsEnabled && !loading && (
            <CategoryChips
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Contenedor principal: Cards + Mapa */}
      <div className="flex-1 min-h-0 flex flex-col">
        {homeCardsEnabled && !loading && (
        /* Sección de cards de instrumentos - solo visible cuando ya hay respuesta de la API */
        <div className="flex-shrink-0 overflow-hidden relative" style={{ minHeight: '180px', maxHeight: '220px' }}> 
          <div className="container py-3 h-full flex items-center px-4 md:px-6">
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
            {posts.length === 0 ? (
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
                          {<CategoryName category={post.instrument.category} />}
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
        )}

        {/* Banner entre cards y mapa (en mobile solo se muestra el icono "Cómo funciona" en la barra de búsqueda) */}
        <div className="container mt-4 mb-2 hidden md:block">
          <div className="bg-background/5 border border-border rounded-md py-1 px-2">
            <div className="flex items-center justify-between gap-2 flex-nowrap">
              {/* Hidden on mobile: show only on md+ */}
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground flex-nowrap overflow-x-auto">
                <div role="button" tabIndex={0} className="flex items-center gap-2 rounded-md px-2 py-0.5 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:text-primary cursor-pointer">
                  <PlusCircle className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t('bannerPublish')}</span>
                </div>
                <div role="button" tabIndex={0} className="flex items-center gap-2 rounded-md px-2 py-0.5 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:text-primary cursor-pointer">
                  <Lock className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t('bannerProtected')}</span>
                </div>
                <div role="button" tabIndex={0} className="flex items-center gap-2 rounded-md px-2 py-0.5 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:text-primary cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t('bannerMap')}</span>
                </div>
              </div>

              {/* En desktop: enlace "Cómo funciona". En mobile se usa el icono en la barra de búsqueda */}
              <div className="hidden md:flex items-center w-full md:w-auto justify-end text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-medium"
                  onClick={() => setHowItWorksOpen(true)}
                >
                  <span>{t('bannerHowItWorks')}</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
          <DialogContent>
                    <DialogTitle>{t('howTitle') || t('bannerHowItWorks')}</DialogTitle>
                    <DialogDescription className="mb-2">{t('howDescription') || ''}</DialogDescription>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <DialogClose asChild>
                        <Link href="/how/overview" className="w-full rounded-lg border bg-background flex items-center gap-3 p-3">
                          <Info className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{t('howOverview')}</span>
                        </Link>
                      </DialogClose>

                      <DialogClose asChild>
                        <Link href="/how/care" className="w-full rounded-lg border bg-background flex items-center gap-3 p-3">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{t('howCare')}</span>
                        </Link>
                      </DialogClose>

                      <DialogClose asChild>
                        <Link href="/how/travelers" className="w-full rounded-lg border bg-background flex items-center gap-3 p-3">
                          <Globe className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{t('howTravelers')}</span>
                        </Link>
                      </DialogClose>

                      <DialogClose asChild>
                        <Link href="/how/owners" className="w-full rounded-lg border bg-background flex items-center gap-3 p-3">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{t('howOwners')}</span>
                        </Link>
                      </DialogClose>

                      <DialogClose asChild>
                        <Link href="/how/transparency" className="w-full rounded-lg border bg-background flex items-center gap-3 p-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{t('howTransparency')}</span>
                        </Link>
                      </DialogClose>
                    </div>

          </DialogContent>
        </Dialog>

        {/* Mapa en la parte inferior - ocupa el resto del espacio */}
        <div className="flex-1 min-h-0 border-t overflow-hidden p-1 relative">
          {/* Botón flotante de filtros por categoría */}
          <Popover open={mapFilterOpen} onOpenChange={setMapFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 z-40 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border hover:bg-background"
                aria-label={t('filterByCategory')}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-40 w-56 p-2" align="end" side="bottom" sideOffset={8}>
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">{t('filterByCategory')}</p>
              <div className="flex flex-col gap-0.5">
                <Button
                  variant={selectedCategoryId === null ? 'default' : 'ghost'}
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setMapFilterOpen(false);
                  }}
                >
                  {t('all')}
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryId === cat.id ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setMapFilterOpen(false);
                    }}
                  >
                    <CategoryName category={cat} />
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {!loading && (
            <>
              <MapViewDynamic
                posts={posts}
                center={mapCenter}
                zoom={13}
                onMarkerClick={handleMarkerClick}
              />
              {/* Card de resumen del post seleccionado */}
              {selectedPost && (
                <div className="absolute bottom-4 left-4 z-40 max-w-[300px] md:max-w-[350px]">
                  <Card className="shadow-lg border-2">
                    <CardHeader className="p-3 pb-2">
                      {selectedPost.instrument.photos[0] && (
                        <div className="relative w-full h-32 mb-2 rounded-md overflow-hidden">
                          <Image
                            src={selectedPost.instrument.photos[0].url}
                            alt={selectedPost.instrument.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardTitle className="text-base line-clamp-1">{selectedPost.instrument.title}</CardTitle>
                      <CardDescription className="text-xs">
                        <CategoryName category={selectedPost.instrument.category} /> • {(() => {
                          // Extraer solo la ciudad de la dirección completa (antes de la primera coma o el primer número)
                          const cityOnly = selectedPost.city.split(',')[0].trim();
                          return cityOnly;
                        })()}
                        {selectedPost.areaText && `, ${selectedPost.areaText}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRequest(selectedPost.id)}
                        >
                          {t('request')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPost(null)}
                        >
                          {t('close')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trust / confidence block */}
        <div className="container mt-2">
          <TrustBlock />
        </div>
      </div>
    </div>
  );
}
