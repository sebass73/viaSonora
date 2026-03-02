"use client"

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { CityAutocomplete } from '@/components/ui/city-autocomplete';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  whatsappUrl: string | null;
  city: string | null;
  country: string | null;
  locationText: string | null;
  lat: number | null;
  lng: number | null;
  onboardingCompleted: boolean;
  termsAcceptedAt: Date | null;
}

export function ProfileForm() {
  const t = useTranslations('profile');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    image: '',
    phone: '',
    whatsappUrl: '',
    city: '',
    country: '',
    locationText: '',
    lat: null as number | null,
    lng: null as number | null,
    termsAccepted: false,
  });

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData({
          name: data.name || '',
          lastName: data.lastName || '',
          image: data.image || '',
          phone: data.phone || '',
          whatsappUrl: data.whatsappUrl || '',
          city: data.city || '',
          country: data.country || '',
          locationText: data.locationText || '',
          lat: data.lat || null,
          lng: data.lng || null,
          termsAccepted: !!data.termsAcceptedAt,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('invalidFileType'));
      return;
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t('fileTooBig'));
      return;
    }

    setUploadingImage(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setFormData({ ...formData, image: data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('errorUploadImage'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: formData.image || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          lat: formData.lat || undefined,
          lng: formData.lng || undefined,
          termsAccepted: formData.termsAccepted ? true : undefined,
        }),
      });

      if (res.ok) {
        await fetchUser();
        alert(t('successUpdate'));
      } else {
        const error = await res.json();
        alert(`${t('errorUpdate')}: ${error.error || t('errorUpdateMessage')}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('errorUpdate'));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return <div className="container py-8">{t('loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna izquierda - Formulario */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
            </div>

            {/* Columna derecha - Foto de perfil */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 group cursor-pointer">
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-gray-300">
                  {formData.image ? (
                    <Image
                      src={formData.image}
                      alt={t('profilePhotoAlt')}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">
                        {formData.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {/* Overlay con ícono al hover */}
                  <div 
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <span className="text-white text-sm">{t('uploading')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="whatsappUrl">{t('whatsappUrl')}</Label>
            <Input
              id="whatsappUrl"
              value={formData.whatsappUrl}
              onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
              placeholder={t('whatsappPlaceholder')}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">{t('contactLocation')}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t('contactLocationHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="city">{t('cityLabel')}</Label>
              <CityAutocomplete
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                onSelect={(city, lat, lng, _fullAddress, _state, country) => {
                  setFormData({
                    ...formData,
                    city: city || '',
                    country: country || '',
                    lat,
                    lng,
                  });
                }}
                placeholder={t('citySearchPlaceholder')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('citySearchHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="country">{t('countryLabel')}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder={t('countryPlaceholder')}
              />
            </div>
            {formData.lat != null && formData.lng != null && (
              <p className="text-xs text-muted-foreground">
                {t('savedCoordinates')}: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="locationText">{t('zoneLabel')}</Label>
            <Input
              id="locationText"
              value={formData.locationText}
              onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
              placeholder={t('zonePlaceholder')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('zoneHint')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="termsAccepted" className="cursor-pointer">
              {t('termsAccept')}{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTermsOpen(true);
                }}
                className="text-primary underline hover:text-primary/80"
              >
                {t('termsLink')}
              </button>
            </Label>
          </div>

          <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('termsDialogTitle')}</DialogTitle>
                <DialogDescription>
                  {t('termsDialogDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <section>
                  <h3 className="font-semibold mb-2">1. Aceptación de los Términos</h3>
                  <p className="text-muted-foreground">
                    Al acceder y utilizar ViaSonora, aceptas estar sujeto a estos términos y condiciones. 
                    Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">2. Descripción del Servicio</h3>
                  <p className="text-muted-foreground">
                    ViaSonora es un marketplace que conecta a músicos viajeros con propietarios de instrumentos musicales. 
                    Facilitamos la conexión entre usuarios, pero no somos parte de las transacciones ni garantizamos 
                    la calidad o disponibilidad de los instrumentos publicados.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">3. Registro y Cuenta de Usuario</h3>
                  <p className="text-muted-foreground">
                    Para utilizar nuestros servicios, debes crear una cuenta proporcionando información precisa y actualizada. 
                    Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que ocurran bajo tu cuenta. 
                    Debes notificarnos inmediatamente de cualquier uso no autorizado de tu cuenta.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">4. Publicación de Instrumentos</h3>
                  <p className="text-muted-foreground">
                    Los propietarios (OWNER) pueden publicar instrumentos musicales con fotografías y ubicación aproximada. 
                    Toda la información proporcionada debe ser precisa y veraz. Las publicaciones están sujetas a moderación 
                    y pueden ser rechazadas o eliminadas si no cumplen con nuestras políticas.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">5. Búsqueda y Solicitudes</h3>
                  <p className="text-muted-foreground">
                    Los clientes (CLIENT) pueden buscar instrumentos por ciudad y tipo, ver publicaciones en mapa o lista, 
                    y enviar solicitudes a los propietarios. El contacto del propietario solo se revela después de que 
                    la solicitud sea aceptada.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">6. Privacidad y Ubicación</h3>
                  <p className="text-muted-foreground">
                    Para proteger tu privacidad, las ubicaciones exactas se ofuscan (jitter) en las visualizaciones públicas. 
                    Solo se muestra una ubicación aproximada. La ubicación exacta solo se comparte cuando una solicitud es aceptada.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">7. Responsabilidades del Usuario</h3>
                  <p className="text-muted-foreground">
                    Eres responsable de todas las interacciones con otros usuarios. ViaSonora no se hace responsable de 
                    disputas entre usuarios, daños a instrumentos, o problemas derivados de las transacciones. 
                    Recomendamos verificar la condición del instrumento antes de cualquier acuerdo.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">8. Contenido Prohibido</h3>
                  <p className="text-muted-foreground">
                    No está permitido publicar contenido falso, engañoso, ofensivo, ilegal o que viole derechos de terceros. 
                    Las publicaciones pueden ser reportadas y serán revisadas por nuestro equipo de moderación.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">9. Modificación de los Términos</h3>
                  <p className="text-muted-foreground">
                    Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                    Los cambios entrarán en vigor al publicarse en la plataforma. 
                    El uso continuado de ViaSonora después de los cambios constituye tu aceptación de los nuevos términos.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">10. Limitación de Responsabilidad</h3>
                  <p className="text-muted-foreground">
                    ViaSonora se proporciona &quot;tal cual&quot; sin garantías de ningún tipo. No garantizamos que el servicio 
                    esté libre de errores, interrupciones o que cumpla con tus expectativas específicas. 
                    En la medida máxima permitida por la ley, no seremos responsables de daños indirectos, incidentales o consecuentes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">11. Contacto</h3>
                  <p className="text-muted-foreground">
                    Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos a través de la plataforma 
                    o utilizando los canales de comunicación oficiales de ViaSonora.
                  </p>
                </section>
              </div>
            </DialogContent>
          </Dialog>

          <Button type="submit" disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

