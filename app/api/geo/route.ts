import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_LAT = -34.6037;
const FALLBACK_LNG = -58.3816;

function isLocalIp(ip: string | null): boolean {
  if (!ip) return true;
  const trimmed = ip.split(',')[0].trim();
  return (
    trimmed === '127.0.0.1' ||
    trimmed === '::1' ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('10.')
  );
}

export async function GET(request: NextRequest) {
  try {
    // 1) Vercel geolocation (en producción)
    const latHeader = request.headers.get('x-vercel-ip-latitude');
    const lngHeader = request.headers.get('x-vercel-ip-longitude');
    const cityHeader = request.headers.get('x-vercel-ip-city');
    const countryHeader = request.headers.get('x-vercel-ip-country');

    if (latHeader != null && lngHeader != null) {
      const lat = parseFloat(latHeader);
      const lng = parseFloat(lngHeader);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return NextResponse.json({
          lat,
          lng,
          city: cityHeader ?? undefined,
          country: countryHeader ?? undefined,
        });
      }
    }

    // 2) IP del cliente y geolocalización vía ip-api.com (local o sin headers Vercel)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = (forwarded?.split(',')[0]?.trim() || realIp || '').trim() || undefined;

    // Sin IP o IP local (ej. desarrollo): ip-api.com sin IP usa la IP de salida del servidor = tu conexión real
    const ipForGeo = clientIp && !isLocalIp(clientIp) ? clientIp : undefined;
    const url = ipForGeo
      ? `http://ip-api.com/json/${encodeURIComponent(ipForGeo)}?fields=status,lat,lon,city,countryCode`
      : 'http://ip-api.com/json/?fields=status,lat,lon,city,countryCode';

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data?.status === 'success' && data?.lat != null && data?.lon != null) {
      return NextResponse.json({
        lat: Number(data.lat),
        lng: Number(data.lon),
        city: data.city ?? undefined,
        country: data.countryCode ?? undefined,
      });
    }
  } catch (e) {
    console.error('[api/geo]', e);
  }

  return NextResponse.json({
    lat: FALLBACK_LAT,
    lng: FALLBACK_LNG,
    city: 'Buenos Aires',
    country: 'AR',
  });
}
