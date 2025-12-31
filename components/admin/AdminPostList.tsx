"use client"

import { useState, useEffect } from 'react';
import { AdminPostCard } from './AdminPostCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Post {
  id: string;
  city: string;
  areaText: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  instrument: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    category: {
      nameEs: string;
    };
    owner: {
      id: string;
      name: string | null;
      lastName: string | null;
      email: string;
    };
  };
  owner: {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
  };
}

export function AdminPostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotal(data.total);
      } else {
        console.error('Error fetching posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Recargar posts
        fetchPosts();
      } else {
        alert('Error al actualizar el estado del post');
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Error al actualizar el estado del post');
    }
  };

  if (loading) {
    return <div className="container py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderación de Posts</h2>
          <p className="text-sm text-muted-foreground">
            Total: {total} posts
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_APPROVAL">Pendientes</SelectItem>
            <SelectItem value="APPROVED">Aprobados</SelectItem>
            <SelectItem value="REJECTED">Rechazados</SelectItem>
            <SelectItem value="BANNED">Baneados</SelectItem>
            <SelectItem value="EXPIRED">Expirados</SelectItem>
            <SelectItem value="ALL">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay posts con este estado
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <AdminPostCard
              key={post.id}
              post={post}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

