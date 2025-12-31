/**
 * Aplica jitter (ruido) a coordenadas para proteger privacidad
 * Nunca exponer lat/lng exactos en APIs públicas
 */
export function getPublicLatLng(lat: number, lng: number): { lat: number; lng: number } {
  // Aplicar jitter aleatorio entre -0.01 y +0.01 grados
  // Esto es aproximadamente ±1km de variación
  const jitterRange = 0.01;
  
  const latJitter = (Math.random() - 0.5) * 2 * jitterRange;
  const lngJitter = (Math.random() - 0.5) * 2 * jitterRange;
  
  return {
    lat: lat + latJitter,
    lng: lng + lngJitter,
  };
}

/**
 * Valida que las coordenadas sean válidas
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

