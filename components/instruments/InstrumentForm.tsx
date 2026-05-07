"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';
import { CityAutocomplete } from '@/components/ui/city-autocomplete';
import { EmojiPickerButton } from '@/components/ui/emoji-picker-button';
import { AvailabilityForm } from './AvailabilityForm';
import { CategoryName } from '@/components/CategoryName';

interface Category {
  id: string;
  slug: string;
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
    country?: string | null;
    areaText: string | null;
    lat: number;
    lng: number;
    isPrimary: boolean;
    useProfileLocation?: boolean;
  }>;
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
}

interface InstrumentFormProps {
  instrument?: Instrument;
}

export function InstrumentForm({ instrument }: InstrumentFormProps) {
  const t = useTranslations('instruments');
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
  const [location, setLocation] = useState<{
    city: string;
    country: string;
    areaText: string;
    lat: number;
    lng: number;
    isPrimary: boolean;
    useProfileLocation: boolean;
  } | null>(null);
  const [userProfileLocation, setUserProfileLocation] = useState<{
    city: string | null;
    country: string | null;
    locationText: string | null;
    lat: number | null;
    lng: number | null;
  } | null>(null);
  const [availability, setAvailability] = useState<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>>([]);
  const [availabilityValidationEnabled, setAvailabilityValidationEnabled] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const extrasTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : []))
      .then((flags: { key: string; enabled: boolean }[]) => {
        if (cancelled) return;
        const flag = flags.find((f) => f.key === 'AVAILABILITY_VALIDATION');
        setAvailabilityValidationEnabled(flag?.enabled ?? false);
      })
      .catch(() => {
        if (!cancelled) setAvailabilityValidationEnabled(false);
      });
    return () => { cancelled = true; };
  }, []);

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
      const primaryLocation = instrument.locations.find((loc) => loc.isPrimary) || instrument.locations[0];
      if (primaryLocation) {
        setLocation({
          city: primaryLocation.city,
          country: (primaryLocation as any).country || '',
          areaText: primaryLocation.areaText || '',
          lat: primaryLocation.lat,
          lng: primaryLocation.lng,
          isPrimary: true,
          useProfileLocation: Boolean((primaryLocation as any).useProfileLocation) || false,
        });
      }
      if (instrument.availability) {
        setAvailability(instrument.availability);
      }
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
        // Solo establecer si tiene al menos ciudad y coordenadas
        if ((data.city || data.addressText) && data.lat && data.lng) {
          setUserProfileLocation({
            city: data.city || data.addressText,
            country: data.country ?? null,
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
      alert(t('minPhotosRequired'));
      return;
    }

    if (!location) {
      alert(t('addLocationRequired'));
      return;
    }

    if (location.lat === 0 || location.lng === 0 || !location.city.trim()) {
      alert(t('invalidLocationsAlert'));
      return;
    }

    setLoading(true);

    try {
      const url = instrument ? `/api/instruments/${instrument.id}` : '/api/instruments';
      const method = instrument ? 'PUT' : 'POST';

      // Preparar datos del formulario, filtrando campos vacíos en modo edición
      const submitData: any = {
        ...formData,
        photos,
        locations: [{
          city: location.city,
          country: location.country || null,
          areaText: location.areaText || null,
          lat: location.lat,
          lng: location.lng,
          isPrimary: true,
          useProfileLocation: Boolean(location.useProfileLocation),
        }],
      };

      // Manejar disponibilidad solo si el flag de validación está activo
      if (availabilityValidationEnabled) {
        if (availability.length > 0) {
          submitData.availability = availability;
        } else if (instrument) {
          submitData.availability = [];
        }
      }
      // Si el flag está inactivo, no enviar availability (se permite cualquier fecha/hora)

      // En modo edición, no incluir categoryId si está vacío (mantener el existente)
      if (instrument && !submitData.categoryId) {
        delete submitData.categoryId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        router.push('/instruments');
      } else {
        const error = await res.json();
        alert(`${t('errorSaving')}: ${error.error || t('errorSavingMessage')}`);
      }
    } catch (error) {
      console.error('Error saving instrument:', error);
      alert(t('errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const createDefaultLocation = useCallback(() => {
    const shouldUseProfile = userProfileLocation &&
      (userProfileLocation.city || userProfileLocation.country) &&
      userProfileLocation.lat &&
      userProfileLocation.lng;

    setLocation({
      city: shouldUseProfile ? (userProfileLocation.city || '') : '',
      country: shouldUseProfile ? (userProfileLocation.country || '') : '',
      areaText: shouldUseProfile ? (userProfileLocation.locationText || '') : '',
      lat: shouldUseProfile ? (userProfileLocation.lat || 0) : 0,
      lng: shouldUseProfile ? (userProfileLocation.lng || 0) : 0,
      isPrimary: true,
      useProfileLocation: Boolean(shouldUseProfile),
    });
  }, [userProfileLocation]);

  const clearLocation = () => {
    setLocation(null);
  };

  const updateLocation = (field: string, value: any) => {
    setLocation((current) => {
      if (!current) return current;
      return { ...current, [field]: value };
    });
  };

  const handleCitySelect = (_cityInput: string, city: string, lat: number, lng: number, _fullAddress: string, _state?: string, country?: string) => {
    setLocation((current) => {
      if (!current) return current;
      return {
        ...current,
        city,
        country: country || '',
        lat,
        lng,
        areaText: current.areaText || '',
        useProfileLocation: false,
      };
    });
  };

  const handleUseProfileLocationToggle = (checked: boolean) => {
    const hasProfile = userProfileLocation && (userProfileLocation.city || userProfileLocation.country) && userProfileLocation.lat && userProfileLocation.lng;
    if (checked && hasProfile && userProfileLocation) {
      setLocation((current) => {
        if (!current) return current;
        return {
          ...current,
          city: userProfileLocation.city || '',
          country: userProfileLocation.country || '',
          areaText: userProfileLocation.locationText || '',
          lat: userProfileLocation.lat ?? 0,
          lng: userProfileLocation.lng ?? 0,
          useProfileLocation: true,
        };
      });
    } else {
      setLocation((current) => {
        if (!current) return current;
        return { ...current, useProfileLocation: false };
      });
    }
  };

  useEffect(() => {
    if (!instrument && !location) {
      createDefaultLocation();
    }
  }, [instrument, location, createDefaultLocation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{instrument ? t('formTitleEdit') : t('formTitleNew')}</CardTitle>
        <CardDescription>
          {t('formDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">{t('titleLabel')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoryId">{t('categoryLabel')} *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <CategoryName category={cat} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">{t('descriptionLabel')} *</Label>
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
              <Label htmlFor="brand">{t('brandLabel')}</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">{t('modelLabel')}</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="condition">{t('conditionLabel')} *</Label>
            <Select
              value={formData.condition}
              onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">{t('conditionExcellent')}</SelectItem>
                <SelectItem value="GOOD">{t('conditionGood')}</SelectItem>
                <SelectItem value="FAIR">{t('conditionFair')}</SelectItem>
                <SelectItem value="POOR">{t('conditionPoor')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="extras">{t('extrasLabel')}</Label>
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
              placeholder={t('extrasPlaceholder')}
              rows={3}
            />
          </div>

          <PhotoUpload photos={photos} onChange={setPhotos} />

          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label>{t('whereAvailable')} *</Label>
                <p className="text-sm text-muted-foreground">
                  {t('whereAvailableHint')}
                </p>
              </div>
              {location && (
                <Button type="button" variant="ghost" size="sm" onClick={clearLocation}>
                  {t('remove')}
                </Button>
              )}
            </div>
            {location ? (
              <div className="border p-4 rounded-lg mb-2 space-y-2">
                {userProfileLocation && (userProfileLocation.city || userProfileLocation.country) && userProfileLocation.lat && userProfileLocation.lng && !location.useProfileLocation && (
                  <div className="mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseProfileLocationToggle(true)}
                      className="w-full"
                    >
                      📍 {t('useProfileLocation')}: {[userProfileLocation.city, userProfileLocation.country].filter(Boolean).join(', ')}
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <CityAutocomplete
                      value={location.city}
                      onChange={(value) => {
                        updateLocation('city', value);
                        if (location.useProfileLocation) updateLocation('useProfileLocation', false);
                        updateLocation('lat', 0);
                        updateLocation('lng', 0);
                      }}
                      onSelect={(city, lat, lng, _fa, state, country) => handleCitySelect(location.city, city, lat, lng, '', state, country)}
                      placeholder={t('searchCityPlaceholder')}
                      required
                      disabled={location.useProfileLocation}
                    />
                  </div>
                  <Input
                    placeholder={t('areaPlaceholder')}
                    value={location.areaText}
                    onChange={(e) => {
                      updateLocation('areaText', e.target.value);
                      if (location.useProfileLocation) {
                        updateLocation('useProfileLocation', false);
                      }
                    }}
                    disabled={location.useProfileLocation}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {userProfileLocation && (userProfileLocation.city || userProfileLocation.country) && userProfileLocation.lat && userProfileLocation.lng && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="useProfile-location"
                        checked={location.useProfileLocation}
                        onChange={(e) => handleUseProfileLocationToggle(e.target.checked)}
                        className="mr-2"
                      />
                      <Label htmlFor="useProfile-location" className="text-sm cursor-pointer">
                        {t('useProfileLocation')} ({[userProfileLocation.city, userProfileLocation.country].filter(Boolean).join(', ')})
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('addOneLocation')}
              </p>
            )}
          </div>

          {availabilityValidationEnabled && (
            <AvailabilityForm
              value={availability}
              onChange={setAvailability}
              disabled={loading}
            />
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? t('saving') : t('save')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
