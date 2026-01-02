"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import Image from 'next/image';

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
  };
}

export default function ExplorePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 0,
  });

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchCity) params.set('city', searchCity);
      if (searchText) params.set('search', searchText);
      params.set('page', currentPage.toString());
      params.set('pageSize', pagination.pageSize.toString());

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setPosts(result.data || result); // Compatibilidad con respuesta antigua
        if (result.pagination) {
          setPagination(result.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Resetear a página 1 al buscar
    fetchPosts();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="container py-4">Cargando...</div>;
  }

  return (
    <div className="container py-4">
      <h1 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">Explorar Instrumentos</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 md:mb-6">
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

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se encontraron instrumentos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                {post.instrument.photos[0] && (
                  <div className="relative w-full h-32 md:h-48">
                    <Image
                      src={post.instrument.photos[0].url}
                      alt={post.instrument.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-1">{post.instrument.title}</CardTitle>
                  <CardDescription>
                    {post.instrument.category.nameEs} • {post.city}
                    {post.areaText && `, ${post.areaText}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

