import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    request: {
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/users/[id]/profile/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/users/user-1/profile', { method: 'GET' });
}

const params = Promise.resolve({ id: 'user-1' });

const baseUser = {
  id: 'user-1',
  name: 'Ada',
  lastName: 'Lovelace',
  image: null,
  city: 'CABA',
  state: 'Buenos Aires',
  country: 'Argentina',
  createdAt: new Date('2025-01-01'),
  email: 'ada@example.com',
  phone: '+54 11 1234 5678',
  whatsappUrl: 'https://wa.me/5491112345678',
  locationText: 'Palermo',
  lat: -34.58,
  lng: -58.43,
};

function setQueryResults([byRole, overall, lenderLoans, returnerLoans, reviews]: [
  unknown[],
  unknown,
  number,
  number,
  unknown[],
]) {
  (prisma.review.groupBy as any).mockResolvedValue(byRole);
  (prisma.review.aggregate as any).mockResolvedValue(overall);
  (prisma.request.count as any)
    .mockResolvedValueOnce(lenderLoans)
    .mockResolvedValueOnce(returnerLoans);
  (prisma.review.findMany as any).mockResolvedValue(reviews);
}

describe('GET /api/users/[id]/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(null); // public endpoint — no session
  });

  it('returns 200 with no session (public, unauthenticated)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [],
      { _avg: { rating: null }, _count: { _all: 0 } },
      0,
      0,
      [],
    ]);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(200);
  });

  it('returns 404 when the user does not exist', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(404);
  });

  it('splits role averages from the groupBy rows', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [
        { subjectRole: 'LENDER', _avg: { rating: 4.5 }, _count: { _all: 2 } },
        { subjectRole: 'RETURNER', _avg: { rating: 5 }, _count: { _all: 1 } },
      ],
      { _avg: { rating: 4.6666666 }, _count: { _all: 3 } },
      2,
      1,
      [],
    ]);

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(body.ratings.asLender).toEqual({ average: 4.5, reviewCount: 2, completedLoans: 2 });
    expect(body.ratings.asReturner).toEqual({ average: 5, reviewCount: 1, completedLoans: 1 });
  });

  it('response has no email, phone, whatsappUrl, lat, lng, or locationText', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [],
      { _avg: { rating: null }, _count: { _all: 0 } },
      0,
      0,
      [],
    ]);

    const res = await GET(makeRequest(), { params });
    const raw = await res.text();

    expect(raw).not.toContain('email');
    expect(raw).not.toContain('phone');
    expect(raw).not.toContain('whatsappUrl');
    expect(raw).not.toContain('lat');
    expect(raw).not.toContain('lng');
    expect(raw).not.toContain('locationText');
  });

  it('state (a): zero completed loans, zero reviews -> average null', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [],
      { _avg: { rating: null }, _count: { _all: 0 } },
      0,
      0,
      [],
    ]);

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(body.ratings.asLender).toEqual({ average: null, reviewCount: 0, completedLoans: 0 });
  });

  it('state (b): completed loans exist but none rated -> average null, completedLoans preserved', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [],
      { _avg: { rating: null }, _count: { _all: 0 } },
      3,
      0,
      [],
    ]);

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(body.ratings.asLender).toEqual({ average: null, reviewCount: 0, completedLoans: 3 });
  });

  it('state (c): completed and rated -> real average, reviewCount, completedLoans', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(baseUser);
    setQueryResults([
      [{ subjectRole: 'LENDER', _avg: { rating: 4.5 }, _count: { _all: 2 } }],
      { _avg: { rating: 4.5 }, _count: { _all: 2 } },
      3,
      0,
      [],
    ]);

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(body.ratings.asLender).toEqual({ average: 4.5, reviewCount: 2, completedLoans: 3 });
  });
});
