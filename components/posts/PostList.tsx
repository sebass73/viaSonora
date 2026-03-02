"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import Image from 'next/image';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { CategoryName } from '@/components/CategoryName';

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
      slug: string;
    };
  };
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  BANNED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

export function PostList() {
  const t = useTranslations('common');
  const tPosts = useTranslations('posts');
  const router = useRouter();
  const statusLabels: Record<string, string> = {
    PENDING_APPROVAL: tPosts('statusPendingApproval'),
    APPROVED: tPosts('statusApproved'),
    REJECTED: tPosts('statusRejected'),
    BANNED: tPosts('statusBanned'),
    EXPIRED: tPosts('statusExpired'),
  };
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
    if (!confirm(tPosts('deleteConfirm'))) {
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
        alert(tPosts('errorDeleting'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(tPosts('errorDeleting'));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="container py-4">{t('loading')}</div>;
  }

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4 md:mb-6 gap-2">
        <h1 className="text-xl md:text-3xl font-bold">{tPosts('title')}</h1>
        <Button onClick={() => router.push('/posts/new')} size="sm" className="text-xs md:text-sm">
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{tPosts('newPost')}</span>
          <span className="sm:hidden">{tPosts('newShort')}</span>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{tPosts('noPosts')}</p>
            <Button onClick={() => router.push('/posts/new')}>
              {tPosts('createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
            {posts.map((post) => (
              <Card key={post.id}>
                {post.instrument.photos[0] && (
                  <div className="relative w-full h-24 md:h-48">
                    <Image
                      src={post.instrument.photos[0].url}
                      alt={post.instrument.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="line-clamp-1 text-sm md:text-base">{post.instrument.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    <CategoryName category={post.instrument.category} /> • {(() => {
                      // Extraer solo la ciudad de la dirección completa (antes de la primera coma)
                      const cityOnly = post.city.split(',')[0].trim();
                      return cityOnly;
                    })()}
                    {post.areaText && `, ${post.areaText}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 flex-wrap">
                    <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${statusColors[post.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[post.status] || post.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tPosts('expires')}: {new Date(post.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1.5 md:gap-2 flex-wrap">
                    {post.status === 'PENDING_APPROVAL' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/posts/${post.id}/edit`)}
                        className="flex-1 min-w-0"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('edit')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/posts/${post.id}`)}
                      className="flex-1 min-w-0"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {tPosts('view')}
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

