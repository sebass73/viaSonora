"use client"

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RequestFormProps {
  postId: string;
  onSuccess?: () => void;
}

export function RequestForm({ postId, onSuccess }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    message: '',
    accessories: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar que las fechas están completas
      if (!formData.fromDate || !formData.toDate) {
        alert('Debes seleccionar las fechas de inicio y fin');
        setLoading(false);
        return;
      }

      // Validar que toDate > fromDate
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      if (to <= from) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        setLoading(false);
        return;
      }

      // Validar mensaje
      if (formData.message.trim().length < 10) {
        alert('El mensaje debe tener al menos 10 caracteres');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
          message: formData.message.trim(),
          accessories: formData.accessories.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate">Fecha de inicio *</Label>
              <Input
                id="fromDate"
                type="datetime-local"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="toDate">Fecha de fin *</Label>
              <Input
                id="toDate"
                type="datetime-local"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

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
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 10 caracteres
            </p>
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


