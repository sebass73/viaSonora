"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Availability {
  dayOfWeek: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isAvailable: boolean;
}

interface RequestFormProps {
  postId: string;
  instrumentId: string;
  availability?: Availability[];
  onSuccess?: () => void;
}

export function RequestForm({ postId, instrumentId, availability = [], onSuccess }: RequestFormProps) {
  const router = useRouter();
  const t = useTranslations('requests');
  const tInstruments = useTranslations('instruments');
  const [loading, setLoading] = useState(false);
  const [availabilityValidationEnabled, setAvailabilityValidationEnabled] = useState<boolean>(true); // por defecto activo hasta cargar flags
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [fromTime, setFromTime] = useState<string>('09:00');
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [toTime, setToTime] = useState<string>('18:00');
  const [formData, setFormData] = useState({
    message: '',
    accessories: '',
  });
  const [errors, setErrors] = useState<{
    fromDate?: string;
    toDate?: string;
    message?: string;
  }>({});

  // Cargar feature flag de validación por disponibilidad
  useEffect(() => {
    let cancelled = false;
    fetch('/api/feature-flags')
      .then((res) => res.ok ? res.json() : [])
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

  // Función para verificar si una fecha está disponible según la disponibilidad configurada
  const isDateAvailable = (date: Date): boolean => {
    if (!availabilityValidationEnabled || availability.length === 0) {
      return true;
    }
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    return !!dayAvailability;
  };

  // Función para obtener los días disponibles para el calendario
  const getAvailableDays = (): Date[] | undefined => {
    if (!availabilityValidationEnabled || availability.length === 0) {
      return undefined;
    }
    return undefined;
  };

  // Función para deshabilitar días no disponibles (solo si el feature flag está activo)
  const isDayDisabled = (date: Date): boolean => {
    if (!availabilityValidationEnabled || availability.length === 0) {
      return false;
    }
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    return !dayAvailability;
  };

  // Función para obtener la disponibilidad de un día específico
  const getDayAvailability = (date: Date): Availability | undefined => {
    if (!availabilityValidationEnabled || availability.length === 0) {
      return undefined;
    }
    const dayOfWeek = date.getDay();
    return availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
  };

  // Función para obtener el texto de disponibilidad formateado
  const getAvailabilitySummary = (): string => {
    if (!availabilityValidationEnabled || availability.length === 0) {
      return t('availableAnyTime');
    }

    const dayKeys = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'] as const;
    const days = dayKeys.map((k) => tInstruments(k));
    const grouped: Record<string, string[]> = {};

    availability.forEach(avail => {
      const key = `${avail.startTime}-${avail.endTime}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(days[avail.dayOfWeek]);
    });

    const summaries = Object.entries(grouped).map(([timeRange, dayNames]) => {
      const [start, end] = timeRange.split('-');
      if (dayNames.length === 7) {
        return `${t('allDays')}: ${start} - ${end}`;
      } else if (dayNames.length === 1) {
        return `${dayNames[0]}: ${start} - ${end}`;
      } else {
        return `${dayNames.join(', ')}: ${start} - ${end}`;
      }
    });

    return summaries.join(' | ');
  };

  // Validar que la hora esté dentro del rango disponible (solo si el feature flag está activo)
  const validateTime = (date: Date | undefined, time: string, field: 'fromDate' | 'toDate'): string | undefined => {
    if (!date || !availabilityValidationEnabled || availability.length === 0) {
      return undefined;
    }

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    
    if (!dayAvailability) {
      return t('errorDayNotAvailable');
    }

    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;
    const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
      return t('errorTimeBetween', { start: dayAvailability.startTime, end: dayAvailability.endTime });
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar mensaje siempre
    if (formData.message.trim().length < 10) {
      setErrors(prev => ({ ...prev, message: t('errorMessageMinChars') }));
      return;
    }

    let fromDateStr: string;
    let toDateStr: string;

    if (availabilityValidationEnabled) {
      // Validaciones de fecha/hora cuando el feature está activo
      if (!fromDate) {
        setErrors(prev => ({ ...prev, fromDate: t('errorSelectStartDate') }));
        return;
      }
      if (!toDate) {
        setErrors(prev => ({ ...prev, toDate: t('errorSelectEndDate') }));
        return;
      }
      if (toDate < fromDate) {
        setErrors(prev => ({ ...prev, toDate: t('errorEndAfterStart') }));
        return;
      }
      const fromTimeError = validateTime(fromDate, fromTime, 'fromDate');
      if (fromTimeError) {
        setErrors(prev => ({ ...prev, fromDate: fromTimeError }));
        return;
      }
      const toTimeError = validateTime(toDate, toTime, 'toDate');
      if (toTimeError) {
        setErrors(prev => ({ ...prev, toDate: toTimeError }));
        return;
      }
      const [fromHour, fromMin] = fromTime.split(':').map(Number);
      const [toHour, toMin] = toTime.split(':').map(Number);
      const fromYear = fromDate.getFullYear();
      const fromMonth = fromDate.getMonth();
      const fromDay = fromDate.getDate();
      const toYear = toDate.getFullYear();
      const toMonth = toDate.getMonth();
      const toDay = toDate.getDate();
      const fromDateTime = new Date(fromYear, fromMonth, fromDay, fromHour, fromMin, 0, 0);
      const toDateTime = new Date(toYear, toMonth, toDay, toHour, toMin, 0, 0);
      if (toDateTime <= fromDateTime) {
        setErrors(prev => ({ ...prev, toDate: t('errorEndAfterStartTime') }));
        return;
      }
      fromDateStr = `${fromYear}-${String(fromMonth + 1).padStart(2, '0')}-${String(fromDay).padStart(2, '0')}`;
      toDateStr = `${toYear}-${String(toMonth + 1).padStart(2, '0')}-${String(toDay).padStart(2, '0')}`;
      const fromTimeStr = `${String(fromHour).padStart(2, '0')}:${String(fromMin).padStart(2, '0')}`;
      const toTimeStr = `${String(toHour).padStart(2, '0')}:${String(toMin).padStart(2, '0')}`;
      fromDateStr = `${fromDateStr}T${fromTimeStr}:00`;
      toDateStr = `${toDateStr}T${toTimeStr}:00`;
    } else {
      // Con el feature desactivado: usar fechas por defecto (hoy 09:00 - hoy 18:00)
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      fromDateStr = `${y}-${m}-${d}T09:00:00`;
      toDateStr = `${y}-${m}-${d}T18:00:00`;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          fromDate: fromDateStr,
          toDate: toDateStr,
          message: formData.message.trim(),
          accessories: formData.accessories.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes('Ya existe una solicitud activa')) {
          alert(t('errorDuplicateRequest'));
          if (onSuccess) {
            onSuccess();
          }
          return;
        }
        alert(data.error || t('errorSendingRequest'));
        return;
      }

      alert(t('successSent'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/requests');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert(t('errorSendingRequest'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('formTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {availabilityValidationEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground",
                      errors.fromDate && "border-destructive"
                    )}
                    disabled={loading}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    disabled={(date) => {
                      // Deshabilitar fechas pasadas
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      // Deshabilitar días no disponibles
                      return isDayDisabled(date);
                    }}
                    modifiers={{
                      available: (date) => {
                        if (!availabilityValidationEnabled || availability.length === 0) return true;
                        return !isDayDisabled(date);
                      }
                    }}
                    modifiersClassNames={{
                      available: 'rdp-day_available'
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {fromDate && (
                <div className="mt-2">
                  <TimePicker
                    value={fromTime}
                    onChange={setFromTime}
                    disabled={loading}
                    label={t('startTime')}
                  />
                </div>
              )}
              {errors.fromDate && (
                <p className="text-sm text-destructive mt-1">{errors.fromDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground",
                      errors.toDate && "border-destructive"
                    )}
                    disabled={loading}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    disabled={(date) => {
                      // Deshabilitar fechas pasadas
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      // Deshabilitar si fromDate está seleccionado y esta fecha es anterior
                      if (fromDate && date < fromDate) return true;
                      // Deshabilitar días no disponibles
                      return isDayDisabled(date);
                    }}
                    modifiers={{
                      available: (date) => {
                        if (!availabilityValidationEnabled || availability.length === 0) return true;
                        return !isDayDisabled(date);
                      }
                    }}
                    modifiersClassNames={{
                      available: 'rdp-day_available'
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {toDate && (
                <div className="mt-2">
                  <TimePicker
                    value={toTime}
                    onChange={setToTime}
                    disabled={loading}
                    label={t('endTime')}
                  />
                </div>
              )}
              {errors.toDate && (
                <p className="text-sm text-destructive mt-1">{errors.toDate}</p>
              )}
            </div>
          </div>
          )}

          {availabilityValidationEnabled && availability.length > 0 && (
            <div className="space-y-2">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm font-medium mb-2">📅 {t('availabilityTitle')}</p>
                <div className="space-y-1">
                  {(() => {
                    const dayKeys = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'] as const;
                    const days = dayKeys.map((k) => tInstruments(k));
                    const grouped: Record<string, { days: string[], startTime: string, endTime: string }> = {};

                    availability.forEach(avail => {
                      const key = `${avail.startTime}-${avail.endTime}`;
                      if (!grouped[key]) {
                        grouped[key] = { days: [], startTime: avail.startTime, endTime: avail.endTime };
                      }
                      grouped[key].days.push(days[avail.dayOfWeek]);
                    });

                    return Object.values(grouped).map((group, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[120px]">
                          {group.days.length === 7 
                            ? t('allDays') 
                            : group.days.length === 1
                            ? group.days[0]
                            : group.days.join(', ')}:
                        </span>
                        <span className="text-muted-foreground">
                          {group.startTime} - {group.endTime}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 {t('availabilityCalendarHint')}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="message">{t('messageRequired')}</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('messagePlaceholder')}
              rows={4}
              required
              disabled={loading}
              className={errors.message ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('minChars')}
            </p>
            {errors.message && (
              <p className="text-sm text-destructive mt-1">{errors.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="accessories">{t('accessoriesOptional')}</Label>
            <Textarea
              id="accessories"
              value={formData.accessories}
              onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              placeholder={t('accessoriesPlaceholder')}
              rows={2}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('sending') : t('formTitle')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
