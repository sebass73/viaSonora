"use client"

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestList } from '@/components/requests/RequestList';

export default function RequestsPage() {
  const t = useTranslations('requests');
  return (
    <div className="container py-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
      </Card>
      <RequestList />
    </div>
  );
}


