import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Nominatim API endpoint
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', query);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('limit', '10');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('extratags', '1');
    nominatimUrl.searchParams.set('accept-language', 'es,en');

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'ViaSonora/1.0 (contact@viasonora.com)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding service unavailable' },
        { status: response.status }
      );
    }

    const data: NominatimResult[] = await response.json();

    // Transform results to a more useful format
    const results = data.map((item) => {
      const address = item.address;
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



