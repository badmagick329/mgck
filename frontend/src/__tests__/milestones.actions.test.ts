/**
 * @jest-environment node
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import {
  createMilestoneAction,
  listMilestonesAction,
  syncMilestonesAction,
} from '@/actions/milestones';
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.Mock;

const publicId = '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const stored = {
  publicId,
  name: 'Launch',
  timestamp: 1_800_000_000_000,
  timezone: 'Europe/London',
  color: '#123456',
  updatedAt: 1_790_000_000_000,
  deletedAt: null,
};

describe('milestone server actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_URL = 'http://djangobackend:8002';
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'signed-core-token' }),
    });
    global.fetch = jest.fn();
  });

  test('legacy actions forward JWT authentication without trusting username', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            event_name: 'Launch',
            event_datetime_utc: '2027-01-15T08:00:00Z',
            event_timezone: 'Europe/London',
            created: '2026-07-16T10:00:00Z',
            color: '#123456',
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    await listMilestonesAction();
    await createMilestoneAction(stored);

    const listCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(listCall[0].searchParams.has('username')).toBe(false);
    expect(listCall[1].headers).toMatchObject({
      Authorization: 'Bearer signed-core-token',
    });
    const createCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(createCall[1].headers).toMatchObject({
      Authorization: 'Bearer signed-core-token',
    });
    expect(JSON.parse(createCall[1].body)).not.toHaveProperty('username');
  });

  test('sync converts between local and authenticated wire contracts', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              public_id: publicId,
              name: 'Launch',
              timestamp: stored.timestamp,
              timezone: stored.timezone,
              color: stored.color,
              updated_at: stored.updatedAt,
              deleted_at: stored.deletedAt,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const result = await syncMilestonesAction([stored]);

    expect(result).toEqual({ ok: true, data: [stored] });
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url.pathname).toBe('/milestones_api/sync');
    expect(options.headers.Authorization).toBe('Bearer signed-core-token');
    expect(JSON.parse(options.body)).toEqual({
      records: [
        {
          public_id: publicId,
          name: stored.name,
          timestamp: stored.timestamp,
          timezone: stored.timezone,
          color: stored.color,
          updated_at: stored.updatedAt,
          deleted_at: null,
        },
      ],
    });
  });

  test('rejects malformed local snapshots before making a request', async () => {
    const invalid = { ...stored, deletedAt: stored.updatedAt + 1 };

    const result = await syncMilestonesAction([invalid]);

    expect(result).toEqual({
      ok: false,
      kind: 'invalid',
      error: 'Invalid milestone snapshot',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejects malformed sync responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              public_id: publicId,
              name: 'Launch',
              timestamp: stored.timestamp,
              timezone: stored.timezone,
              color: stored.color,
              updated_at: stored.updatedAt,
              deleted_at: stored.updatedAt + 1,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const result = await syncMilestonesAction([stored]);

    expect(result).toEqual({
      ok: false,
      kind: 'invalid',
      error: 'Invalid milestone sync response',
    });
  });

  test.each([
    [401, 'unauthenticated'],
    [400, 'invalid'],
    [409, 'conflict'],
    [500, 'transient'],
  ] as const)(
    'classifies sync HTTP %s failures as %s',
    async (status, kind) => {
      (global.fetch as jest.Mock).mockResolvedValue(
        new Response('{}', { status, statusText: 'failed' })
      );

      const result = await syncMilestonesAction([stored]);

      expect(result).toEqual({ ok: false, kind, error: 'failed' });
    }
  );

  test('classifies sync network failures as transient', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const result = await syncMilestonesAction([stored]);

    expect(result).toEqual({
      ok: false,
      kind: 'transient',
      error: 'Milestone sync request failed',
    });
  });
});
