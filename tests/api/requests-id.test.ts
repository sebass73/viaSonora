import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const txMock = {
  request: {
    updateMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    request: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn(txMock)),
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PUT } from '@/app/api/requests/[id]/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/requests/req-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const params = Promise.resolve({ id: 'req-1' });

const baseRequest = {
  id: 'req-1',
  ownerId: 'owner-1',
  clientId: 'client-1',
  status: 'REQUESTED',
  ownerReturnConfirmedAt: null,
  clientReturnConfirmedAt: null,
};

describe('PUT /api/requests/[id] — regression (current behavior)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.request.updateMany.mockReset();
  });

  it('returns 401 when there is no session', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(401);
    expect(prisma.request.update).not.toHaveBeenCalled();
  });

  it('returns 404 when the request does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(null);

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller is neither owner nor client', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'stranger-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(403);
  });

  it('returns 400 when the request is already COMPLETED (terminal state)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'COMPLETED' });

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(400);
    expect(prisma.request.update).not.toHaveBeenCalled();
  });

  it('returns 400 when the request is already CANCELLED (terminal state)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'CANCELLED' });

    const res = await PUT(makeRequest({ status: 'CANCELLED' }), { params });

    expect(res.status).toBe(400);
  });

  it('allows the owner to transition REQUESTED -> ACCEPTED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);
    (prisma.request.update as any).mockResolvedValue({ ...baseRequest, status: 'ACCEPTED' });

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(200);
    expect(prisma.request.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ACCEPTED' }) })
    );
  });

  it('allows the owner to transition REQUESTED -> DECLINED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);
    (prisma.request.update as any).mockResolvedValue({ ...baseRequest, status: 'DECLINED' });

    const res = await PUT(makeRequest({ status: 'DECLINED' }), { params });

    expect(res.status).toBe(200);
  });

  it('allows the client to CANCEL a REQUESTED request', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);
    (prisma.request.update as any).mockResolvedValue({ ...baseRequest, status: 'CANCELLED' });

    const res = await PUT(makeRequest({ status: 'CANCELLED' }), { params });

    expect(res.status).toBe(200);
  });

  it('allows the client to CANCEL an ACCEPTED request', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'ACCEPTED' });
    (prisma.request.update as any).mockResolvedValue({ ...baseRequest, status: 'CANCELLED' });

    const res = await PUT(makeRequest({ status: 'CANCELLED' }), { params });

    expect(res.status).toBe(200);
  });

  it('rejects a disallowed transition: owner cannot CANCEL', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);

    const res = await PUT(makeRequest({ status: 'CANCELLED' }), { params });

    expect(res.status).toBe(400);
    expect(prisma.request.update).not.toHaveBeenCalled();
  });

  it('rejects a disallowed transition: client cannot ACCEPT', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(baseRequest);

    const res = await PUT(makeRequest({ status: 'ACCEPTED' }), { params });

    expect(res.status).toBe(400);
    expect(prisma.request.update).not.toHaveBeenCalled();
  });
});

describe('PUT /api/requests/[id] — bilateral return confirmation (new behavior)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.request.updateMany.mockReset();
  });

  it('rejects {status: "COMPLETED"} — manual completion no longer exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'ACCEPTED' });

    const res = await PUT(makeRequest({ status: 'COMPLETED' }), { params });

    expect(res.status).toBe(400);
    expect(prisma.request.update).not.toHaveBeenCalled();
  });

  it('owner confirms first: sets only ownerReturnConfirmedAt, status stays ACCEPTED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any)
      .mockResolvedValueOnce({ ...baseRequest, status: 'ACCEPTED' })
      .mockResolvedValueOnce({
        ...baseRequest,
        status: 'ACCEPTED',
        ownerReturnConfirmedAt: new Date('2026-01-01'),
      });
    txMock.request.updateMany
      .mockResolvedValueOnce({ count: 1 }) // own-field-null guard succeeds
      .mockResolvedValueOnce({ count: 0 }); // both-not-null guard: client not confirmed yet

    const res = await PUT(makeRequest({ action: 'CONFIRM_RETURN' }), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ACCEPTED');
    expect(txMock.request.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'req-1',
          status: 'ACCEPTED',
          ownerReturnConfirmedAt: null,
        }),
        data: expect.objectContaining({ ownerReturnConfirmedAt: expect.any(Date) }),
      })
    );
    expect(txMock.request.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'req-1',
          status: 'ACCEPTED',
          ownerReturnConfirmedAt: { not: null },
          clientReturnConfirmedAt: { not: null },
        }),
        data: { status: 'COMPLETED' },
      })
    );
  });

  it('client confirms second: reaches COMPLETED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any)
      .mockResolvedValueOnce({
        ...baseRequest,
        status: 'ACCEPTED',
        ownerReturnConfirmedAt: new Date('2026-01-01'),
      })
      .mockResolvedValueOnce({
        ...baseRequest,
        status: 'COMPLETED',
        ownerReturnConfirmedAt: new Date('2026-01-01'),
        clientReturnConfirmedAt: new Date('2026-01-02'),
      });
    txMock.request.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 }); // both now confirmed → completes

    const res = await PUT(makeRequest({ action: 'CONFIRM_RETURN' }), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('COMPLETED');
  });

  it('re-confirm is idempotent: returns 200 with current state, no error', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any)
      .mockResolvedValueOnce({
        ...baseRequest,
        status: 'ACCEPTED',
        ownerReturnConfirmedAt: new Date('2026-01-01'),
      })
      .mockResolvedValueOnce({
        ...baseRequest,
        status: 'ACCEPTED',
        ownerReturnConfirmedAt: new Date('2026-01-01'),
      });
    txMock.request.updateMany
      .mockResolvedValueOnce({ count: 0 }) // already confirmed — no-op
      .mockResolvedValueOnce({ count: 0 });

    const res = await PUT(makeRequest({ action: 'CONFIRM_RETURN' }), { params });

    expect(res.status).toBe(200);
  });

  it('rejects confirmation when status is not ACCEPTED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'REQUESTED' });

    const res = await PUT(makeRequest({ action: 'CONFIRM_RETURN' }), { params });

    expect(res.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects confirmation from a non-party user with 403', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'stranger-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...baseRequest, status: 'ACCEPTED' });

    const res = await PUT(makeRequest({ action: 'CONFIRM_RETURN' }), { params });

    expect(res.status).toBe(403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
