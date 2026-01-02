"use client"

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface InstrumentSuggestion {
  id: string;
  city: string;
  areaText: string | null;
  instrument: {
    id: string;
    title: string;
    description: string;
    category: {
      nameEs: string;
    };
    photos: Array<{ url: string }>;
  };
}

interface InstrumentAutocompleteProps {
  searchQuery: string;
  onSelect?: (postId: string) => void;
}

export function InstrumentAutocomplete({ searchQuery, onSelect }: InstrumentAutocompleteProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const [suggestions, setSuggestions] = useState<InstrumentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('search', searchQuery);
        params.set('pageSize', '5'); // Limitar a 5 sugerencias

        const res = await fetch(`/api/posts?${params.toString()}`);
        if (res.ok) {
          const result = await res.json();
          const data = result.data || result;
          setSuggestions(data);
          setIsOpen(data.length > 0);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 200); // Debounce más corto para sugerencias

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (postId: string) => {
    setIsOpen(false);
    if (onSelect) {
      onSelect(postId);
    } else {
      router.push(`/posts/${postId}`);
    }
  };

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] md:max-h-[400px] overflow-y-auto"
    >
      {loading ? (
        <div className="p-3 md:p-4 text-center text-xs md:text-sm text-muted-foreground">
          {t('loading')}...
        </div>
      ) : (
        <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className="cursor-pointer hover:bg-accent active:bg-accent transition-colors"
              onClick={() => handleSelect(suggestion.id)}
            >
              <CardContent className="p-2 md:p-3">
                <div className="flex gap-2 md:gap-3">
                  {suggestion.instrument.photos[0] && (
                    <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={suggestion.instrument.photos[0].url}
                        alt={suggestion.instrument.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs md:text-sm font-semibold line-clamp-1 mb-1">
                      {suggestion.instrument.title}
                    </CardTitle>
                    {suggestion.instrument.description && (
                      <CardDescription className="text-[10px] md:text-xs line-clamp-2 mb-1">
                        {suggestion.instrument.description.length > 80
                          ? `${suggestion.instrument.description.substring(0, 80)}...`
                          : suggestion.instrument.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                      <span className="truncate">{suggestion.instrument.category.nameEs}</span>
                      <span>•</span>
                      <span className="line-clamp-1 truncate">
                        {suggestion.city.split(',')[0].trim()}
                        {suggestion.areaText && `, ${suggestion.areaText}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

