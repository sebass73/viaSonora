"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string // Format: "HH:mm"
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  label?: string
  id?: string
}

export function TimePicker({ 
  value, 
  onChange, 
  disabled, 
  className,
  label,
  id 
}: TimePickerProps) {
  const [hour, setHour] = React.useState<string>(value?.split(':')[0] || '09')
  const [minute, setMinute] = React.useState<string>(value?.split(':')[1] || '00')

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHour(h || '09')
      setMinute(m || '00')
    }
  }, [value])

  const handleHourChange = (newHour: string) => {
    setHour(newHour)
    onChange?.(`${newHour}:${minute}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute)
    onChange?.(`${hour}:${newMinute}`)
  }

  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  )
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={id} className="text-xs">{label}</Label>}
      <div className="flex items-center gap-1.5">
        <Select
          value={hour}
          onValueChange={handleHourChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="h-9 w-[70px] text-sm">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-base font-semibold px-0.5">:</span>
        <Select
          value={minute}
          onValueChange={handleMinuteChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-[70px] text-sm">
            <SelectValue placeholder="mm" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

