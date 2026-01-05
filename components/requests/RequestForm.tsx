"use client"

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
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
  const [loading, setLoading] = useState(false);
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

  // Función para verificar si una fecha está disponible según la disponibilidad configurada
  const isDateAvailable = (date: Date): boolean => {
    if (availability.length === 0) {
      // Si no hay disponibilidad configurada, permitir cualquier fecha
      return true;
    }

    const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    
    return !!dayAvailability;
  };

  // Función para obtener los días disponibles para el calendario
  const getAvailableDays = (): Date[] | undefined => {
    if (availability.length === 0) {
      return undefined; // Permitir todos los días
    }

    // Retornar undefined para permitir todos los días, pero usaremos disabled para filtrar
    return undefined;
  };

  // Función para deshabilitar días no disponibles
  const isDayDisabled = (date: Date): boolean => {
    if (availability.length === 0) {
      return false; // Si no hay disponibilidad, no deshabilitar días
    }

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    
    return !dayAvailability;
  };

  // Función para obtener la disponibilidad de un día específico
  const getDayAvailability = (date: Date): Availability | undefined => {
    if (availability.length === 0) {
      return undefined;
    }
    const dayOfWeek = date.getDay();
    return availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
  };

  // Función para obtener el texto de disponibilidad formateado
  const getAvailabilitySummary = (): string => {
    if (availability.length === 0) {
      return 'Disponible en cualquier fecha y hora';
    }

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
        return `Todos los días: ${start} - ${end}`;
      } else if (dayNames.length === 1) {
        return `${dayNames[0]}: ${start} - ${end}`;
      } else {
        return `${dayNames.join(', ')}: ${start} - ${end}`;
      }
    });

    return summaries.join(' | ');
  };

  // Validar que la hora esté dentro del rango disponible
  const validateTime = (date: Date | undefined, time: string, field: 'fromDate' | 'toDate'): string | undefined => {
    if (!date || availability.length === 0) {
      return undefined; // Si no hay disponibilidad configurada, no validar
    }

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    
    if (!dayAvailability) {
      return 'Este día no está disponible';
    }

    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;
    const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
      return `La hora debe estar entre ${dayAvailability.startTime} y ${dayAvailability.endTime}`;
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    if (!fromDate) {
      setErrors(prev => ({ ...prev, fromDate: 'Debes seleccionar una fecha de inicio' }));
      return;
    }

    if (!toDate) {
      setErrors(prev => ({ ...prev, toDate: 'Debes seleccionar una fecha de fin' }));
      return;
    }

    // Validar que toDate > fromDate
    if (toDate < fromDate) {
      setErrors(prev => ({ ...prev, toDate: 'La fecha de fin debe ser posterior a la fecha de inicio' }));
      return;
    }

    // Validar horas
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

    // Validar mensaje
    if (formData.message.trim().length < 10) {
      setErrors(prev => ({ ...prev, message: 'El mensaje debe tener al menos 10 caracteres' }));
      return;
    }

    // Construir fechas completas usando el constructor Date(year, month, day, hour, minute)
    // Esto crea la fecha en la zona horaria local, evitando problemas de conversión UTC
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);
    
    // Extraer año, mes y día de las fechas seleccionadas
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth();
    const fromDay = fromDate.getDate();
    
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth();
    const toDay = toDate.getDate();
    
    // Crear fechas en zona horaria local
    const fromDateTime = new Date(fromYear, fromMonth, fromDay, fromHour, fromMin, 0, 0);
    const toDateTime = new Date(toYear, toMonth, toDay, toHour, toMin, 0, 0);

    if (toDateTime <= fromDateTime) {
      setErrors(prev => ({ ...prev, toDate: 'La fecha y hora de fin debe ser posterior a la de inicio' }));
      return;
    }

    setLoading(true);

    try {
      // Enviar fechas como ISO string (se convertirán a UTC, pero el backend las interpretará correctamente)
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          fromDate: fromDateTime.toISOString(),
          toDate: toDateTime.toISOString(),
          message: formData.message.trim(),
          accessories: formData.accessories.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes('Ya existe una solicitud activa')) {
          alert('Ya has enviado una solicitud para este instrumento. Por favor, espera la respuesta del propietario.');
          if (onSuccess) {
            onSuccess();
          }
          return;
        }
        alert(data.error || 'Error al enviar la solicitud');
        return;
      }

      alert('Solicitud enviada correctamente');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/requests');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Solicitud</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
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
                        if (availability.length === 0) return true;
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
                    label="Hora de inicio"
                  />
                </div>
              )}
              {errors.fromDate && (
                <p className="text-sm text-destructive mt-1">{errors.fromDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de fin</Label>
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
                        if (availability.length === 0) return true;
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
                    label="Hora de fin"
                  />
                </div>
              )}
              {errors.toDate && (
                <p className="text-sm text-destructive mt-1">{errors.toDate}</p>
              )}
            </div>
          </div>

          {availability.length > 0 && (
            <div className="space-y-2">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm font-medium mb-2">📅 Disponibilidad del instrumento:</p>
                <div className="space-y-1">
                  {(() => {
                    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
                            ? 'Todos los días' 
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
                  💡 Los días disponibles aparecen resaltados en el calendario. Deberás coordinar la gestión directamente con el propietario.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Explica tu solicitud y cuándo necesitas el instrumento..."
              rows={4}
              required
              disabled={loading}
              className={errors.message ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 10 caracteres
            </p>
            {errors.message && (
              <p className="text-sm text-destructive mt-1">{errors.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="accessories">Accesorios adicionales (opcional)</Label>
            <Textarea
              id="accessories"
              value={formData.accessories}
              onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              placeholder="Especifica si necesitas accesorios adicionales..."
              rows={2}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
