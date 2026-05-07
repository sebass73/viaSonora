"use client"

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InstrumentList } from '@/components/instruments/InstrumentList';

export default function InstrumentsPage() {
  const t = useTranslations('instruments');

  return (
    <div className="container py-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
      </Card>
      <InstrumentList />
    </div>
  );
}




