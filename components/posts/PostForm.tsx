"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryName } from '@/components/CategoryName';

interface Instrument {
  id: string;
  title: string;
  category: {
    slug: string;
  };
  locations: Array<{
    city: string;
    country?: string | null;
    areaText: string | null;
  }>;
}

export function PostForm() {
  const t = useTranslations('common');
  const tPosts = useTranslations('posts');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [formData, setFormData] = useState({
    instrumentId: '',
    city: '',
    country: '',
    areaText: '',
  });

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const res = await fetch('/api/instruments');
      if (res.ok) {
        const response = await res.json();
        // La API devuelve { data: [...], pagination: {...} }
        const instrumentsList = response.data || response;
        setInstruments(Array.isArray(instrumentsList) ? instrumentsList : []);
        
        // Si hay instrumentos, usar el primero y su ubicación primaria
        if (Array.isArray(instrumentsList) && instrumentsList.length > 0) {
          const firstInstrument = instrumentsList[0];
          const primaryLocation = firstInstrument.locations?.find((loc: any) => loc.isPrimary) || firstInstrument.locations?.[0];
          setFormData({
            instrumentId: firstInstrument.id,
            city: primaryLocation?.city || '',
            country: primaryLocation?.country || '',
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
      alert(tPosts('selectInstrumentRequired'));
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
          country: formData.country || undefined,
          areaText: formData.areaText || undefined,
        }),
      });

      if (res.ok) {
        router.push('/posts');
      } else {
        const error = await res.json();
        alert(`${tPosts('errorCreating')}: ${error.error || tPosts('errorCreatingMessage')}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(tPosts('errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  const selectedInstrument = instruments.find(i => i.id === formData.instrumentId);
  const primaryLocation = selectedInstrument?.locations?.find((loc: any) => loc.isPrimary) || selectedInstrument?.locations?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tPosts('formTitle')}</CardTitle>
        <CardDescription>
          {tPosts('formDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instrumentId">{tPosts('instrumentLabel')} *</Label>
            <Select
              value={formData.instrumentId}
              onValueChange={(value) => {
                const instrument = instruments.find(i => i.id === value);
                const location = instrument?.locations?.find((loc: any) => loc.isPrimary) || instrument?.locations?.[0];
                setFormData({
                  instrumentId: value,
                  city: location?.city || '',
                  country: location?.country || '',
                  areaText: location?.areaText || '',
                });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={tPosts('selectInstrument')} />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.title} (<CategoryName category={instrument.category} />)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instruments.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {tPosts('noInstrumentsHint')}{' '}
                <a href="/instruments/new" className="text-primary underline">{tPosts('createOneFirst')}</a>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="city">{tPosts('cityLabel')} *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              placeholder={primaryLocation?.city || tPosts('cityPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="country">{tPosts('countryLabel')}</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder={tPosts('countryPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="areaText">{tPosts('areaLabel')}</Label>
            <Input
              id="areaText"
              value={formData.areaText}
              onChange={(e) => setFormData({ ...formData, areaText: e.target.value })}
              placeholder={primaryLocation?.areaText || tPosts('areaPlaceholder')}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {tPosts('notePending')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || instruments.length === 0}>
              {loading ? tPosts('creating') : tPosts('createButton')}
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

