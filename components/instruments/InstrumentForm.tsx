"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';
import { CityAutocomplete } from '@/components/ui/city-autocomplete';
import { EmojiPickerButton } from '@/components/ui/emoji-picker-button';

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
    useProfileLocation?: boolean;
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
    useProfileLocation: boolean;
  }>>([]);
  const [userProfileLocation, setUserProfileLocation] = useState<{
    addressText: string | null;
    locationText: string | null;
    lat: number | null;
    lng: number | null;
  } | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const extrasTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchUserProfile();
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
        useProfileLocation: Boolean((loc as any).useProfileLocation) || false,
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

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        // Solo establecer si tiene al menos addressText y coordenadas
        if (data.addressText && data.lat && data.lng) {
          setUserProfileLocation({
            addressText: data.addressText,
            locationText: data.locationText,
            lat: data.lat,
            lng: data.lng,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

    // Validar que todas las ubicaciones tengan coordenadas válidas
    const invalidLocations = locations.filter(loc => loc.lat === 0 || loc.lng === 0 || !loc.city.trim());
    if (invalidLocations.length > 0) {
      alert('Todas las ubicaciones deben tener una ciudad válida seleccionada. Por favor, selecciona una ciudad de las sugerencias.');
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
            useProfileLocation: Boolean(loc.useProfileLocation),
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
    // Siempre sugerir la ubicación del perfil si está disponible
    const shouldUseProfile = userProfileLocation && 
      userProfileLocation.addressText && 
      userProfileLocation.lat && 
      userProfileLocation.lng;

    setLocations([...locations, {
      city: shouldUseProfile ? (userProfileLocation.addressText || '') : '',
      areaText: shouldUseProfile ? (userProfileLocation.locationText || '') : '',
      lat: shouldUseProfile ? (userProfileLocation.lat || 0) : 0,
      lng: shouldUseProfile ? (userProfileLocation.lng || 0) : 0,
      isPrimary: locations.length === 0,
      useProfileLocation: Boolean(shouldUseProfile),
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

  const handleCitySelect = (index: number, city: string, lat: number, lng: number, fullAddress: string) => {
    const newLocations = [...locations];
    newLocations[index] = {
      ...newLocations[index],
      city,
      lat,
      lng,
      areaText: newLocations[index].areaText || '', // Mantener areaText si existe
      useProfileLocation: false, // Si se selecciona manualmente, desactivar sync con perfil
    };
    setLocations(newLocations);
  };

  const handleUseProfileLocationToggle = (index: number, checked: boolean) => {
    const newLocations = [...locations];
    
    if (checked && userProfileLocation && userProfileLocation.addressText && userProfileLocation.lat && userProfileLocation.lng) {
      // Sincronizar con ubicación de perfil
      newLocations[index] = {
        ...newLocations[index],
        city: userProfileLocation.addressText,
        areaText: userProfileLocation.locationText || '',
        lat: userProfileLocation.lat,
        lng: userProfileLocation.lng,
        useProfileLocation: true,
      };
    } else {
      // Desactivar sincronización
      newLocations[index] = {
        ...newLocations[index],
        useProfileLocation: false,
      };
    }
    
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">Descripción *</Label>
              <EmojiPickerButton
                onEmojiClick={(emoji) => {
                  const textarea = descriptionTextareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart || 0;
                    const end = textarea.selectionEnd || 0;
                    const text = formData.description;
                    const newText = text.substring(0, start) + emoji + text.substring(end);
                    setFormData({ ...formData, description: newText });
                    // Restaurar posición del cursor después del emoji
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                    }, 0);
                  } else {
                    // Si no hay textarea enfocado, agregar al final
                    setFormData({ ...formData, description: formData.description + emoji });
                  }
                }}
                disabled={loading}
              />
            </div>
            <Textarea
              ref={descriptionTextareaRef}
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="extras">Extras / Accesorios</Label>
              <EmojiPickerButton
                onEmojiClick={(emoji) => {
                  const textarea = extrasTextareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart || 0;
                    const end = textarea.selectionEnd || 0;
                    const text = formData.extras;
                    const newText = text.substring(0, start) + emoji + text.substring(end);
                    setFormData({ ...formData, extras: newText });
                    // Restaurar posición del cursor después del emoji
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                    }, 0);
                  } else {
                    // Si no hay textarea enfocado, agregar al final
                    setFormData({ ...formData, extras: formData.extras + emoji });
                  }
                }}
                disabled={loading}
              />
            </div>
            <Textarea
              ref={extrasTextareaRef}
              id="extras"
              value={formData.extras}
              onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
              placeholder="Especifica accesorios adicionales..."
              rows={3}
            />
          </div>

          <PhotoUpload photos={photos} onChange={setPhotos} />

          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label>¿Dónde está disponible este instrumento? *</Label>
                <p className="text-sm text-muted-foreground">
                  Agrega las ubicaciones donde este instrumento está disponible para otros músicos.
                </p>
              </div>
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
                {userProfileLocation && userProfileLocation.addressText && userProfileLocation.lat && userProfileLocation.lng && !loc.useProfileLocation && (
                  <div className="mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseProfileLocationToggle(index, true)}
                      className="w-full"
                    >
                      📍 Usar mi ubicación de perfil: {userProfileLocation.addressText}
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <CityAutocomplete
                      value={loc.city}
                      onChange={(city) => {
                        updateLocation(index, 'city', city);
                        // Si se edita manualmente, desactivar sync con perfil
                        if (loc.useProfileLocation) {
                          updateLocation(index, 'useProfileLocation', false);
                        }
                      }}
                      onSelect={(city, lat, lng, fullAddress) => handleCitySelect(index, city, lat, lng, fullAddress)}
                      placeholder="Buscar ciudad *"
                      required
                      disabled={loc.useProfileLocation}
                    />
                  </div>
                  <Input
                    placeholder="Zona/Barrio (opcional)"
                    value={loc.areaText}
                    onChange={(e) => {
                      updateLocation(index, 'areaText', e.target.value);
                      // Si se edita manualmente, desactivar sync con perfil
                      if (loc.useProfileLocation) {
                        updateLocation(index, 'useProfileLocation', false);
                      }
                    }}
                    disabled={loc.useProfileLocation}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {userProfileLocation && userProfileLocation.addressText && userProfileLocation.lat && userProfileLocation.lng && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`useProfile-${index}`}
                        checked={loc.useProfileLocation}
                        onChange={(e) => handleUseProfileLocationToggle(index, e.target.checked)}
                        className="mr-2"
                      />
                      <Label htmlFor={`useProfile-${index}`} className="text-sm cursor-pointer">
                        Usar mi ubicación de perfil ({userProfileLocation.addressText})
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
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
                    <Label htmlFor={`primary-${index}`} className="text-sm cursor-pointer">Principal</Label>
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

