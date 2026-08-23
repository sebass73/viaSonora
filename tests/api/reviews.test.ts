import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    request: {
      findUnique: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/reviews/route';
import { PATCH } from '@/app/api/reviews/[id]/route';

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reviews', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reviews/review-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const completedRequest = {
  id: 'req-1',
  ownerId: 'owner-1',
  clientId: 'client-1',
  status: 'COMPLETED',
};

class PrismaKnownError extends Error {
  code: string;
  constructor(code: string) {
    super('Prisma known request error');
    this.code = code;
  }
}

describe('POST /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(res.status).toBe(401);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('returns 400 for rating 0 (out of range)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 0 }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for rating 6 (out of range)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 6 }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-integer rating', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 3.5 }));

    expect(res.status).toBe(400);
  });

  it('returns 404 when the request does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(null);

    const res = await POST(makePostRequest({ requestId: 'req-missing', rating: 5 }));

    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller is not a party of the request', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'stranger-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(completedRequest);

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(res.status).toBe(403);
  });

  it('returns 400 when the request is not COMPLETED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue({ ...completedRequest, status: 'ACCEPTED' });

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(res.status).toBe(400);
  });

  it('returns 409 when a pre-check finds an existing review by this author', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(completedRequest);
    (prisma.review.findUnique as any).mockResolvedValue({ id: 'review-existing' });

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(res.status).toBe(409);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('returns 409 when the create race hits the DB unique constraint (P2002)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(completedRequest);
    (prisma.review.findUnique as any).mockResolvedValue(null);
    (prisma.review.create as any).mockRejectedValue(new PrismaKnownError('P2002'));

    const res = await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(res.status).toBe(409);
  });

  it('client rating owner: subjectId=ownerId, subjectRole=LENDER', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(completedRequest);
    (prisma.review.findUnique as any).mockResolvedValue(null);
    (prisma.review.create as any).mockResolvedValue({ id: 'review-1' });

    await POST(makePostRequest({ requestId: 'req-1', rating: 4, comment: 'Great' }));

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'req-1',
          authorId: 'client-1',
          subjectId: 'owner-1',
          subjectRole: 'LENDER',
          rating: 4,
          comment: 'Great',
        }),
      })
    );
  });

  it('owner rating client: subjectId=clientId, subjectRole=RETURNER', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.request.findUnique as any).mockResolvedValue(completedRequest);
    (prisma.review.findUnique as any).mockResolvedValue(null);
    (prisma.review.create as any).mockResolvedValue({ id: 'review-2' });

    await POST(makePostRequest({ requestId: 'req-1', rating: 5 }));

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'req-1',
          authorId: 'owner-1',
          subjectId: 'client-1',
          subjectRole: 'RETURNER',
          rating: 5,
        }),
      })
    );
  });
});

describe('PATCH /api/reviews/[id]', () => {
  const params = Promise.resolve({ id: 'review-1' });
  const reviewNoReply = {
    id: 'review-1',
    authorId: 'client-1',
    subjectId: 'owner-1',
    reply: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ reply: 'Thanks!' }), { params });

    expect(res.status).toBe(401);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller is the review author (not the subject)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'client-1' } });
    (prisma.review.findUnique as any).mockResolvedValue(reviewNoReply);

    const res = await PATCH(makePatchRequest({ reply: 'Thanks!' }), { params });

    expect(res.status).toBe(403);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('returns 409 when the review already has a reply', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.review.findUnique as any).mockResolvedValue({ ...reviewNoReply, reply: 'Already replied' });

    const res = await PATCH(makePatchRequest({ reply: 'Another one' }), { params });

    expect(res.status).toBe(409);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('sets reply and repliedAt when the subject replies for the first time', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner-1' } });
    (prisma.review.findUnique as any).mockResolvedValue(reviewNoReply);
    (prisma.review.update as any).mockResolvedValue({ ...reviewNoReply, reply: 'Thanks!', repliedAt: new Date() });

    const res = await PATCH(makePatchRequest({ reply: 'Thanks!' }), { params });

    expect(res.status).toBe(200);
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'review-1' },
        data: expect.objectContaining({ reply: 'Thanks!', repliedAt: expect.any(Date) }),
      })
    );
  });
});
