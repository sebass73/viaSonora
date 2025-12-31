"use client"

import { useState, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        return data.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      onChange([...photos, ...newUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error al subir las fotos');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === photos.length - 1)
    ) {
      return;
    }

    const newPhotos = [...photos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          Fotos ({photos.length}/{maxPhotos})
        </label>
        <p className="text-sm text-muted-foreground">
          Mínimo 3, máximo {maxPhotos} fotos
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border">
                <Image
                  src={url}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => movePhoto(index, 'up')}
                    disabled={index === 0}
                    className="flex-1 bg-black/50 text-white text-xs py-1 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(index, 'down')}
                    disabled={index === photos.length - 1}
                    className="flex-1 bg-black/50 text-white text-xs py-1 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            id="photo-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Subiendo...' : 'Agregar fotos'}
          </Button>
        </div>
      )}
    </div>
  );
}

