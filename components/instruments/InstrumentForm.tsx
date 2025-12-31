"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';

interface Category {
  id: string;
  nameEs: string;
}

interface Instrument {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  brand: string | null;
  model: string | null;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  extras: string | null;
  photos: Array<{ url: string }>;
  locations: Array<{
    city: string;
    areaText: string | null;
    lat: number;
    lng: number;
    isPrimary: boolean;
  }>;
}

interface InstrumentFormProps {
  instrument?: Instrument;
}

export function InstrumentForm({ instrument }: InstrumentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    brand: '',
    model: '',
    condition: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    extras: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [locations, setLocations] = useState<Array<{
    city: string;
    areaText: string;
    lat: number;
    lng: number;
    isPrimary: boolean;
  }>>([]);

  useEffect(() => {
    fetchCategories();
    if (instrument) {
      setFormData({
        title: instrument.title,
        description: instrument.description,
        categoryId: instrument.categoryId,
        brand: instrument.brand || '',
        model: instrument.model || '',
        condition: instrument.condition,
        extras: instrument.extras || '',
      });
      setPhotos(instrument.photos.map(p => p.url));
      setLocations(instrument.locations.map(loc => ({
        city: loc.city,
        areaText: loc.areaText || '',
        lat: loc.lat,
        lng: loc.lng,
        isPrimary: loc.isPrimary,
      })));
    }
  }, [instrument]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length < 3) {
      alert('Debes subir al menos 3 fotos');
      return;
    }

    if (locations.length === 0) {
      alert('Debes agregar al menos una ubicación');
      return;
    }

    setLoading(true);

    try {
      const url = instrument ? `/api/instruments/${instrument.id}` : '/api/instruments';
      const method = instrument ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photos,
          locations: locations.map(loc => ({
            city: loc.city,
            areaText: loc.areaText || null,
            lat: loc.lat,
            lng: loc.lng,
            isPrimary: loc.isPrimary,
          })),
        }),
      });

      if (res.ok) {
        router.push('/instruments');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo guardar el instrumento'}`);
      }
    } catch (error) {
      console.error('Error saving instrument:', error);
      alert('Error al guardar el instrumento');
    } finally {
      setLoading(false);
    }
  };

  const addLocation = () => {
    setLocations([...locations, {
      city: '',
      areaText: '',
      lat: 0,
      lng: 0,
      isPrimary: locations.length === 0,
    }]);
  };

  const removeLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    if (newLocations.length > 0 && !newLocations.some(l => l.isPrimary)) {
      newLocations[0].isPrimary = true;
    }
    setLocations(newLocations);
  };

  const updateLocation = (index: number, field: string, value: any) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setLocations(newLocations);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{instrument ? 'Editar Instrumento' : 'Nuevo Instrumento'}</CardTitle>
        <CardDescription>
          Completa la información de tu instrumento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoryId">Categoría *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nameEs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="condition">Condición *</Label>
            <Select
              value={formData.condition}
              onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">Excelente</SelectItem>
                <SelectItem value="GOOD">Bueno</SelectItem>
                <SelectItem value="FAIR">Regular</SelectItem>
                <SelectItem value="POOR">Malo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="extras">Extras / Accesorios</Label>
            <Textarea
              id="extras"
              value={formData.extras}
              onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
              rows={3}
            />
          </div>

          <PhotoUpload photos={photos} onChange={setPhotos} />

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Ubicaciones *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                + Agregar ubicación
              </Button>
            </div>
            {locations.map((loc, index) => (
              <div key={index} className="border p-4 rounded-lg mb-2 space-y-2">
                <div className="flex justify-between">
                  <Label>Ubicación {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(index)}
                  >
                    Eliminar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ciudad *"
                    value={loc.city}
                    onChange={(e) => updateLocation(index, 'city', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Zona/Barrio"
                    value={loc.areaText}
                    onChange={(e) => updateLocation(index, 'areaText', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="Latitud"
                    value={loc.lat !== 0 ? loc.lat.toString() : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir números, punto decimal, y signo negativo al inicio
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        const numValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(numValue) || value === '' || value === '-' || value === '.') {
                          updateLocation(index, 'lat', value === '' ? 0 : (isNaN(numValue) ? 0 : numValue));
                        }
                      }
                    }}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Longitud"
                    value={loc.lng !== 0 ? loc.lng.toString() : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir números, punto decimal, y signo negativo al inicio
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        const numValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(numValue) || value === '' || value === '-' || value === '.') {
                          updateLocation(index, 'lng', value === '' ? 0 : (isNaN(numValue) ? 0 : numValue));
                        }
                      }
                    }}
                    required
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={loc.isPrimary}
                      onChange={(e) => {
                        const newLocations = [...locations];
                        newLocations.forEach((l, i) => {
                          l.isPrimary = i === index ? e.target.checked : false;
                        });
                        setLocations(newLocations);
                      }}
                      className="mr-2"
                    />
                    <Label className="text-sm">Principal</Label>
                  </div>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Agrega al menos una ubicación donde está disponible el instrumento
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
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

