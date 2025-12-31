"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Instrument {
  id: string;
  title: string;
  category: {
    nameEs: string;
  };
  locations: Array<{
    city: string;
    areaText: string | null;
  }>;
}

export function PostForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [formData, setFormData] = useState({
    instrumentId: '',
    city: '',
    areaText: '',
  });

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const res = await fetch('/api/instruments');
      if (res.ok) {
        const data = await res.json();
        setInstruments(data);
        
        // Si hay instrumentos, usar el primero y su ubicación primaria
        if (data.length > 0) {
          const firstInstrument = data[0];
          const primaryLocation = firstInstrument.locations?.find((loc: any) => loc.isPrimary) || firstInstrument.locations?.[0];
          setFormData({
            instrumentId: firstInstrument.id,
            city: primaryLocation?.city || '',
            areaText: primaryLocation?.areaText || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instrumentId) {
      alert('Debes seleccionar un instrumento');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrumentId: formData.instrumentId,
          city: formData.city || undefined,
          areaText: formData.areaText || undefined,
        }),
      });

      if (res.ok) {
        router.push('/posts');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear el post'}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear el post');
    } finally {
      setLoading(false);
    }
  };

  const selectedInstrument = instruments.find(i => i.id === formData.instrumentId);
  const primaryLocation = selectedInstrument?.locations?.find((loc: any) => loc.isPrimary) || selectedInstrument?.locations?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Publicación</CardTitle>
        <CardDescription>
          Publica un instrumento para que otros músicos lo encuentren
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instrumentId">Instrumento *</Label>
            <Select
              value={formData.instrumentId}
              onValueChange={(value) => {
                const instrument = instruments.find(i => i.id === value);
                const location = instrument?.locations?.find((loc: any) => loc.isPrimary) || instrument?.locations?.[0];
                setFormData({
                  instrumentId: value,
                  city: location?.city || '',
                  areaText: location?.areaText || '',
                });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un instrumento" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.title} ({instrument.category.nameEs})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instruments.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No tienes instrumentos. <a href="/instruments/new" className="text-primary underline">Crea uno primero</a>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              placeholder={primaryLocation?.city || 'Ej: Buenos Aires'}
            />
          </div>

          <div>
            <Label htmlFor="areaText">Zona/Barrio</Label>
            <Input
              id="areaText"
              value={formData.areaText}
              onChange={(e) => setFormData({ ...formData, areaText: e.target.value })}
              placeholder={primaryLocation?.areaText || 'Ej: Palermo'}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> El post quedará en estado <strong>PENDING_APPROVAL</strong> hasta que un moderador lo apruebe.
              Una vez aprobado, será visible en el mapa y listados públicos.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || instruments.length === 0}>
              {loading ? 'Creando...' : 'Crear Publicación'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

