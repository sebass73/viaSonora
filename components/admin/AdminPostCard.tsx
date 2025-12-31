"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Check, X, Ban, Eye } from 'lucide-react';
import Link from 'next/link';

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

interface AdminPostCardProps {
  post: Post;
  onStatusChange: (postId: string, newStatus: string) => void;
}

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Pendiente',
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

export function AdminPostCard({ post, onStatusChange }: AdminPostCardProps) {
  return (
    <Card>
      <div className="flex flex-col md:flex-row">
        {post.instrument.photos[0] && (
          <div className="relative w-full md:w-48 h-48 md:h-auto">
            <Image
              src={post.instrument.photos[0].url}
              alt={post.instrument.title}
              fill
              className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
            />
          </div>
        )}
        <div className="flex-1">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-1">{post.instrument.title}</CardTitle>
                <CardDescription>
                  {post.instrument.category.nameEs} • {post.city}
                  {post.areaText && `, ${post.areaText}`}
                </CardDescription>
              </div>
              <Badge className={statusColors[post.status] || 'bg-gray-100 text-gray-800'}>
                {statusLabels[post.status] || post.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>Propietario:</strong> {post.owner.name} {post.owner.lastName}</p>
                <p><strong>Email:</strong> {post.owner.email}</p>
                <p><strong>Creado:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                <p><strong>Expira:</strong> {new Date(post.expiresAt).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(post.id, 'APPROVED')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onStatusChange(post.id, 'REJECTED')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onStatusChange(post.id, 'BANNED')}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Banear
                    </Button>
                  </>
                )}
                {post.status === 'APPROVED' && (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onStatusChange(post.id, 'BANNED')}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Banear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(post.id, 'REJECTED')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  </>
                )}
                {post.status === 'REJECTED' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(post.id, 'APPROVED')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onStatusChange(post.id, 'BANNED')}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Banear
                    </Button>
                  </>
                )}
                {post.status === 'BANNED' && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(post.id, 'APPROVED')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Desbanear y Aprobar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link href={`/posts/${post.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Post
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

