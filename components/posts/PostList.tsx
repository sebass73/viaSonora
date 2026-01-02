"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import Image from 'next/image';
import { Plus, Eye, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  city: string;
  areaText: string | null;
  status: string;
  expiresAt: string;
  instrument: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    category: {
      nameEs: string;
    };
  };
}

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Pendiente de aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  BANNED: 'Baneado',
  EXPIRED: 'Expirado',
};

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  BANNED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

export function PostList() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 3,
    totalPages: 0,
  });

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?my=true&page=${currentPage}&pageSize=${pagination.pageSize}`);
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Si quedamos en una página vacía después de eliminar, volver a la página anterior
        if (posts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchPosts();
        }
      } else {
        alert('Error al eliminar el post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error al eliminar el post');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Publicaciones</h1>
        <Button onClick={() => router.push('/posts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Publicación
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes publicaciones</p>
            <Button onClick={() => router.push('/posts/new')}>
              Crear tu primera publicación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id}>
                {post.instrument.photos[0] && (
                  <div className="relative w-full h-48">
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
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[post.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[post.status] || post.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Expira: {new Date(post.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/posts/${post.id}`)}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
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

