"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const res = await fetch('/api/instruments');
      if (res.ok) {
        const data = await res.json();
        setInstruments(data);
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
        fetchInstruments();
      } else {
        alert('Error al eliminar el instrumento');
      }
    } catch (error) {
      console.error('Error deleting instrument:', error);
      alert('Error al eliminar el instrumento');
    }
  };

  if (loading) {
    return <div className="container py-8">Cargando...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Instrumentos</h1>
        <Button onClick={() => router.push('/instruments/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Instrumento
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => (
            <Card key={instrument.id}>
              {instrument.photos[0] && (
                <div className="relative w-full h-48">
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
      )}
    </div>
  );
}

