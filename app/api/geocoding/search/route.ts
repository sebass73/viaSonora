import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

// Normaliza y limpia la consulta para mejorar resultados con typos o formato confuso
function normalizeQuery(q: string): string {
  let s = q.trim().replace(/\s+/g, ' ');
  // Correcciones frecuentes de países/nombres
  const fixes: [RegExp, string][] = [
    [/argentinaa/gi, 'Argentina'],
    [/argentinar\b/gi, 'Argentina'],
    [/m[eé]xico/gi, 'México'],
    [/españa/gi, 'España'],
    [/colombiaa/gi, 'Colombia'],
  ];
  fixes.forEach(([regex, replacement]) => {
    s = s.replace(regex, replacement);
  });
  return s.trim();
}

// Ejecuta búsqueda en Nominatim
async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
  nominatimUrl.searchParams.set('q', query);
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('limit', '10');
  nominatimUrl.searchParams.set('addressdetails', '1');
  nominatimUrl.searchParams.set('extratags', '1');
  nominatimUrl.searchParams.set('accept-language', 'es,en');

  const response = await fetch(nominatimUrl.toString(), {
    headers: {
      'User-Agent': 'ViaSonora/1.0 (contact@viasonora.com)',
    },
  });

  if (!response.ok) return [];
  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q');

    if (!rawQuery || rawQuery.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const query = normalizeQuery(rawQuery);

    let data: NominatimResult[] = await searchNominatim(query);

    // Si no hay resultados, intentar con el último segmento (ej. país) o el primero (ciudad)
    if (data.length === 0 && query.includes(',')) {
      const parts = query.split(',').map((p) => p.trim()).filter(Boolean);
      const lastPart = parts[parts.length - 1];
      const firstPart = parts[0];
      if (lastPart.length >= 2) {
        data = await searchNominatim(lastPart);
      }
      if (data.length === 0 && firstPart.length >= 2) {
        data = await searchNominatim(firstPart);
      }
    }

    // Transform results to a more useful format
    const results = data.map((item) => {
      const address = item.address || {};
      const cityName = address.city || address.town || address.village || address.municipality || '';
      const stateName = address.state || '';
      const countryName = address.country || '';
      const countryCode = address.country_code?.toUpperCase() || '';

      return {
        displayName: item.display_name,
        city: cityName,
        state: stateName,
        country: countryName,
        countryCode,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        fullAddress: item.display_name,
      };
    });

    // Filter to prioritize cities/towns/villages
    const cityResults = results.filter(
      (r) => r.city && (r.countryCode !== '' || r.country !== '')
    );

    // Return top results (prioritize cities if available, otherwise return all)
    const finalResults = cityResults.length > 0 ? cityResults : results;

    return NextResponse.json({ results: finalResults.slice(0, 10) });
  } catch (error) {
    console.error('Error in geocoding search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



