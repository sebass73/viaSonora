import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    instrument: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/instruments/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/instruments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validInstrumentBody = {
  title: 'Guitarra criolla',
  description: 'Guitarra en buen estado, poco uso',
  categoryId: 'cat-1',
  condition: 'GOOD',
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg',
  ],
  locations: [
    { city: 'CABA', country: 'Argentina', areaText: 'Palermo', lat: -34.58, lng: -58.43, isPrimary: true },
  ],
};

describe('POST /api/instruments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await POST(makeRequest(validInstrumentBody));

    expect(res.status).toBe(401);
    expect(prisma.instrument.create).not.toHaveBeenCalled();
  });

  it('creates the instrument when the payload is valid', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'cat-1' });
    (prisma.instrument.create as any).mockResolvedValue({ id: 'inst-1' });

    const res = await POST(makeRequest(validInstrumentBody));

    expect(res.status).toBe(201);
    expect(prisma.instrument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'user-1',
          title: validInstrumentBody.title,
          categoryId: 'cat-1',
        }),
      })
    );
  });

  it('allows creating the instrument without an optional barrio/zona (areaText)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'cat-1' });
    (prisma.instrument.create as any).mockResolvedValue({ id: 'inst-1' });

    const body = {
      ...validInstrumentBody,
      locations: [{ city: 'CABA', lat: -34.58, lng: -58.43, isPrimary: true }],
    };

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(201);
  });

  it('returns 404 when the category does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.category.findUnique as any).mockResolvedValue(null);

    const res = await POST(makeRequest(validInstrumentBody));

    expect(res.status).toBe(404);
    expect(prisma.instrument.create).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    const { title, ...rest } = validInstrumentBody;

    const res = await POST(makeRequest(rest));

    expect(res.status).toBe(400);
  });

  it('returns 400 when the location is not exactly one', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const res = await POST(makeRequest({ ...validInstrumentBody, locations: [] }));

    expect(res.status).toBe(400);
  });

  it('returns 400 when coordinates are 0,0', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const res = await POST(
      makeRequest({
        ...validInstrumentBody,
        locations: [{ city: 'CABA', lat: 0, lng: 0, isPrimary: true }],
      })
    );

    expect(res.status).toBe(400);
  });
});
