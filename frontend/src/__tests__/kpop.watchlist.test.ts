/**
 * @jest-environment node
 */

import { POST } from '@/app/api/kpopcomebacks/route';
import { GET as GET_ARTISTS } from '@/app/api/kpopcomebacks/artists/route';
import { partitionKpopArtistResults } from '@/lib/kpop';
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
        ordering: 'upcoming_first',
      }).success
    ).toBe(true);
    expect(
      WatchlistComebacksQuerySchema.safeParse({
        artist_public_ids: ['048c3d72-5c61-4f2c-9707-e06b0cc1f7f5'],
        ordering: 'recent_first',
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

  test('forwards artist searches to Django', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const request = new NextRequest(
      'http://localhost:5000/api/kpopcomebacks/artists?q=red+velvet'
    );

    const response = await GET_ARTISTS(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://djangobackend:8002/api/kpopcomebacks/artists?q=red+velvet',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
  });

  test('separates an exact artist from credits covered by following it', () => {
    const exact = {
      public_id: '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
      name: 'ITZY',
    };
    const collaboration = {
      public_id: '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
      name: 'Bebe Rexha feat. Yeji of ITZY',
    };

    expect(
      partitionKpopArtistResults([exact, collaboration], ' itzy ')
    ).toEqual({
      exact,
      covered: [collaboration],
      fallback: [],
    });
    expect(partitionKpopArtistResults([collaboration], 'it')).toEqual({
      exact: undefined,
      covered: [],
      fallback: [collaboration],
    });
  });
});
