"use client"

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PostList } from '@/components/posts/PostList';

export default function PostsPage() {
  const tPosts = useTranslations('posts');

  return (
    <div className="container py-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{tPosts('title')}</CardTitle>
          <CardDescription>{tPosts('description')}</CardDescription>
        </CardHeader>
      </Card>
      <PostList />
    </div>
  );
}




