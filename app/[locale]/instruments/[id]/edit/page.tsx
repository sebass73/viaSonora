"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';

export default function EditInstrumentPage() {
  const t = useTranslations('common');
  const tInstruments = useTranslations('instruments');
  const params = useParams();
  const [instrument, setInstrument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInstrument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchInstrument = async () => {
    try {
      const res = await fetch(`/api/instruments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInstrument(data);
      }
    } catch (error) {
      console.error('Error fetching instrument:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container py-8">{t('loading')}</div>;
  }

  if (!instrument) {
    return <div className="container py-8">{tInstruments('instrumentNotFound')}</div>;
  }

  return (
    <div className="container py-8">
      <InstrumentForm instrument={instrument} />
    </div>
  );
}

