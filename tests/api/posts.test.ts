import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    instrument: { findUnique: vi.fn() },
    post: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/privacy', () => ({
  getPublicLatLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/posts/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/posts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const baseInstrument = {
  id: 'inst-1',
  ownerId: 'user-1',
  locations: [
    { city: 'CABA', country: 'Argentina', areaText: 'Palermo', lat: -34.58, lng: -58.43, isPrimary: true },
  ],
};

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await POST(makeRequest({ instrumentId: 'inst-1', city: 'CABA' }));

    expect(res.status).toBe(401);
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('returns 400 when the payload fails validation (missing city)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const res = await POST(makeRequest({ instrumentId: 'inst-1' }));

    expect(res.status).toBe(400);
  });

  it('returns 404 when the instrument does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.instrument.findUnique as any).mockResolvedValue(null);

    const res = await POST(makeRequest({ instrumentId: 'missing', city: 'CABA' }));

    expect(res.status).toBe(404);
  });

  it('returns 403 when the instrument belongs to another user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-2' } });
    (prisma.instrument.findUnique as any).mockResolvedValue(baseInstrument);

    const res = await POST(makeRequest({ instrumentId: 'inst-1', city: 'CABA' }));

    expect(res.status).toBe(403);
  });

  it('returns 400 when the instrument has no location', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.instrument.findUnique as any).mockResolvedValue({ ...baseInstrument, locations: [] });

    const res = await POST(makeRequest({ instrumentId: 'inst-1', city: 'CABA' }));

    expect(res.status).toBe(400);
  });

  it('creates the post as PENDING_APPROVAL with a 30-day expiration', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.instrument.findUnique as any).mockResolvedValue(baseInstrument);
    (prisma.post.create as any).mockResolvedValue({ id: 'post-1', status: 'PENDING_APPROVAL' });

    const res = await POST(makeRequest({ instrumentId: 'inst-1', city: 'CABA', areaText: 'Belgrano' }));

    expect(res.status).toBe(201);
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          instrumentId: 'inst-1',
          ownerId: 'user-1',
          city: 'CABA',
          areaText: 'Belgrano',
          status: 'PENDING_APPROVAL',
        }),
      })
    );
  });

  it('falls back to the instrument primary location areaText when not provided (optional barrio/zona)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.instrument.findUnique as any).mockResolvedValue(baseInstrument);
    (prisma.post.create as any).mockResolvedValue({ id: 'post-1' });

    await POST(makeRequest({ instrumentId: 'inst-1', city: 'CABA' }));

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ areaText: 'Palermo' }),
      })
    );
  });
});
