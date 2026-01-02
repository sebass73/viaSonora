"use client"

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CitySuggestion {
  displayName: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: string, lat: number, lng: number, fullAddress: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar ciudad...",
  disabled = false,
  required = false,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if value is too short
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set loading state
    setLoading(true);

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(value.trim())}`);
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error searching cities:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const handleSelect = (suggestion: CitySuggestion) => {
    // Si el displayName tiene más información que solo la ciudad, usarlo
    // Esto captura direcciones específicas como "Santa Fe 2160, Mar del Plata"
    const displayName = suggestion.displayName;
    const cityOnly = suggestion.city || displayName.split(',')[0];
    
    // Usar displayName si tiene más contexto (más de una coma o contiene números/direcciones)
    const hasDetailedAddress = displayName.includes(',') && (
      displayName.split(',').length > 2 || 
      /\d/.test(displayName) || // Contiene números (dirección)
      displayName.length > cityOnly.length + 10 // Es significativamente más largo
    );
    
    const selectedName = hasDetailedAddress ? displayName : cityOnly;
    
    onChange(selectedName);
    onSelect(selectedName, suggestion.lat, suggestion.lng, suggestion.fullAddress);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const formatSuggestion = (suggestion: CitySuggestion) => {
    const parts = [];
    if (suggestion.city) parts.push(suggestion.city);
    if (suggestion.state) parts.push(suggestion.state);
    if (suggestion.country) parts.push(suggestion.country);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    return suggestion.displayName;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="font-medium">{formatSuggestion(suggestion)}</div>
              {suggestion.fullAddress !== formatSuggestion(suggestion) && (
                <div className="text-sm text-muted-foreground truncate">
                  {suggestion.fullAddress}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {showSuggestions && !loading && value.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-4 py-2 text-sm text-muted-foreground">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
}

