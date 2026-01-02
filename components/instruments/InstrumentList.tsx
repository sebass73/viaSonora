"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import Image from 'next/image';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Instrument {
  id: string;
  title: string;
  description: string;
  category: {
    nameEs: string;
  };
  photos: Array<{ url: string }>;
  locations: Array<{
    city: string;
  }>;
}

export function InstrumentList() {
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
    if (!confirm('¿Estás seguro de que quieres eliminar este instrumento?')) {
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
        alert('Error al eliminar el instrumento');
      }
    } catch (error) {
      console.error('Error deleting instrument:', error);
      alert('Error al eliminar el instrumento');
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
      <div className="flex justify-between items-center mb-4 md:mb-6 gap-2">
        <h1 className="text-xl md:text-3xl font-bold">Mis Instrumentos</h1>
        <Button onClick={() => router.push('/instruments/new')} size="sm" className="text-xs md:text-sm">
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Nuevo Instrumento</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {instruments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes instrumentos registrados</p>
            <Button onClick={() => router.push('/instruments/new')}>
              Crear tu primer instrumento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {instruments.map((instrument) => (
              <Card key={instrument.id}>
                {instrument.photos[0] && (
                  <div className="relative w-full h-32 md:h-48">
                    <Image
                      src={instrument.photos[0].url}
                      alt={instrument.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-1">{instrument.title}</CardTitle>
                  <CardDescription>
                    {instrument.category.nameEs}
                    {instrument.locations[0] && ` • ${instrument.locations[0].city}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {instrument.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/instruments/${instrument.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
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

