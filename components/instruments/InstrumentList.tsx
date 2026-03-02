"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import Image from 'next/image';
import { CategoryName } from '@/components/CategoryName';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Instrument {
  id: string;
  title: string;
  description: string;
  category: {
    slug: string;
  };
  photos: Array<{ url: string }>;
  locations: Array<{
    city: string;
  }>;
}

export function InstrumentList() {
  const t = useTranslations('instruments');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 3,
    totalPages: 0,
  });

  useEffect(() => {
    fetchInstruments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/instruments?page=${currentPage}&pageSize=${pagination.pageSize}`);
      if (res.ok) {
        const result = await res.json();
        setInstruments(result.data || result); // Compatibilidad con respuesta antigua
        if (result.pagination) {
          setPagination(result.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      const res = await fetch(`/api/instruments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Si quedamos en una página vacía después de eliminar, volver a la página anterior
        if (instruments.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchInstruments();
        }
      } else {
        alert(t('errorDeleting'));
      }
    } catch (error) {
      console.error('Error deleting instrument:', error);
      alert(t('errorDeleting'));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="container py-4">{tCommon('loading')}</div>;
  }

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4 md:mb-6 gap-2">
        <h1 className="text-xl md:text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => router.push('/instruments/new')} size="sm" className="text-xs md:text-sm">
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{t('newInstrument')}</span>
          <span className="sm:hidden">{t('newShort')}</span>
        </Button>
      </div>

      {instruments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t('noInstruments')}</p>
            <Button onClick={() => router.push('/instruments/new')}>
              {t('createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
            {instruments.map((instrument) => (
              <Card key={instrument.id}>
                {instrument.photos[0] && (
                  <div className="relative w-full h-24 md:h-48">
                    <Image
                      src={instrument.photos[0].url}
                      alt={instrument.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="line-clamp-1 text-sm md:text-base">{instrument.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    <CategoryName category={instrument.category} />
                    {instrument.locations[0] && ` • ${instrument.locations[0].city}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4">
                    {instrument.description}
                  </p>
                  <div className="flex gap-1.5 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/instruments/${instrument.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(instrument.id)}
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

