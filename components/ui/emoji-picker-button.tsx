"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerButtonProps {
  onEmojiClick: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPickerButton({ onEmojiClick, disabled = false }: EmojiPickerButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Cerrar el picker al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className="h-9 w-9 p-0"
        title="Agregar emoji"
      >
        <Smile className="h-4 w-4" />
      </Button>
      {showPicker && (
        <div className="absolute z-50 right-0 top-full mt-2 shadow-lg rounded-lg overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={350}
            height={400}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            searchDisabled={false}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
}

