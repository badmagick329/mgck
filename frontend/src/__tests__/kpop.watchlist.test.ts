/**
 * @jest-environment node
 */

import { POST } from '@/app/api/kpopcomebacks/route';
import {
  ComebackResponseSchema,
  WatchlistComebacksQuerySchema,
} from '@/lib/types/kpop';
import { NextRequest } from 'next/server';

const originalEnv = process.env;

describe('kpop watchlist transport', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      BASE_URL: 'http://djangobackend:8002',
    };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('requires artist public IDs in release responses', () => {
    const release = {
      id: 1,
      title: 'Release',
      artist: 'Artist',
      album: 'Album',
      date: '2026-07-16',
      release_type: 'Single',
      urls: [],
    };

    expect(ComebackResponseSchema.safeParse(release).success).toBe(false);
    expect(
      WatchlistComebacksQuerySchema.safeParse({
        artist_public_ids: ['048c3d72-5c61-4f2c-9707-e06b0cc1f7f5'],
      }).success
    ).toBe(true);
  });

  test('forwards watchlist POST requests to Django', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ count: 0, results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const body = {
      artist_public_ids: ['048c3d72-5c61-4f2c-9707-e06b0cc1f7f5'],
    };
    const request = new NextRequest('http://localhost:5000/api/kpopcomebacks', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://djangobackend:8002/api/kpopcomebacks/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        cache: 'no-store',
      })
    );
  });

  test('passes through Django error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ artist_public_ids: ['Invalid artist'] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const request = new NextRequest('http://localhost:5000/api/kpopcomebacks', {
      method: 'POST',
      body: JSON.stringify({ artist_public_ids: ['not-a-uuid'] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      artist_public_ids: ['Invalid artist'],
    });
  });
});
