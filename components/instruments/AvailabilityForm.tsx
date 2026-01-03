"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { TimePicker } from '@/components/ui/time-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Availability {
  dayOfWeek: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  isAvailable: boolean
}

interface AvailabilityFormProps {
  value?: Availability[]
  onChange?: (availability: Availability[]) => void
  disabled?: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export function AvailabilityForm({ value = [], onChange, disabled }: AvailabilityFormProps) {
  const [availability, setAvailability] = useState<Availability[]>(value)

  useEffect(() => {
    setAvailability(value)
  }, [value])

  const handleToggleDay = (dayOfWeek: number) => {
    const existing = availability.find(a => a.dayOfWeek === dayOfWeek)
    
    if (existing) {
      // Si existe, lo eliminamos
      const updated = availability.filter(a => a.dayOfWeek !== dayOfWeek)
      setAvailability(updated)
      onChange?.(updated)
    } else {
      // Si no existe, lo agregamos con horario por defecto
      const updated = [
        ...availability,
        {
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          isAvailable: true,
        }
      ]
      setAvailability(updated)
      onChange?.(updated)
    }
  }

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', time: string) => {
    const updated = availability.map(a => 
      a.dayOfWeek === dayOfWeek 
        ? { ...a, [field]: time }
        : a
    )
    setAvailability(updated)
    onChange?.(updated)
  }

  const isDaySelected = (dayOfWeek: number) => {
    return availability.some(a => a.dayOfWeek === dayOfWeek)
  }

  const getDayAvailability = (dayOfWeek: number) => {
    return availability.find(a => a.dayOfWeek === dayOfWeek)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidad</CardTitle>
        <CardDescription>
          Configura los días y horarios en que el instrumento está disponible. Si no configuras disponibilidad, se permitirá cualquier fecha/hora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = isDaySelected(day.value)
            const dayAvailability = getDayAvailability(day.value)
            
            return (
              <div key={day.value} className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleToggleDay(day.value)}
                  disabled={disabled}
                  className={cn(
                    "w-full",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.short}
                </Button>
                
                {isSelected && dayAvailability && (
                  <div className="space-y-2.5 p-3 border rounded-md bg-muted/50">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Desde</Label>
                      <TimePicker
                        value={dayAvailability.startTime}
                        onChange={(time) => handleTimeChange(day.value, 'startTime', time)}
                        disabled={disabled}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Hasta</Label>
                      <TimePicker
                        value={dayAvailability.endTime}
                        onChange={(time) => handleTimeChange(day.value, 'endTime', time)}
                        disabled={disabled}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {availability.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Los usuarios deberán coordinar la gestión del instrumento directamente contigo al momento de la solicitud.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

