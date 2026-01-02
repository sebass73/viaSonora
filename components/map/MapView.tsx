"use client"

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Post {
  id: string;
  city: string;
  areaText: string | null;
  instrument: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    category: {
      nameEs: string;
    };
    locations: Array<{
      lat: number;
      lng: number;
    }>;
  };
}

interface MapViewProps {
  posts: Post[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (post: Post) => void;
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);

  return null;
}

export function MapView({ posts, center = [-34.6037, -58.3816], zoom = 13, onMarkerClick }: MapViewProps) {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        {posts.map((post) => {
          const location = post.instrument.locations?.[0];
          if (!location) return null;

          return (
            <Marker
              key={post.id}
              position={[location.lat, location.lng]}
              eventHandlers={{
                click: () => onMarkerClick?.(post),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{post.instrument.title}</h3>
                  <p className="text-xs text-muted-foreground">{post.instrument.category.nameEs}</p>
                  <p className="text-xs text-muted-foreground">{post.city}</p>
                  {onMarkerClick && (
                    <button
                      onClick={() => onMarkerClick(post)}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      Ver detalles
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

