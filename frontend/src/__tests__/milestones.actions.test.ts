/**
 * @jest-environment node
 */

jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));

import { syncMilestonesAction } from '@/actions/milestones';
import { getVerifiedCoreSession } from '../lib/account/verified-session';

const mockVerifiedSession = getVerifiedCoreSession as jest.Mock;
const internalKey = 'test-next-django-internal-key-at-least-32-characters';

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
    process.env.NEXT_DJANGO_INTERNAL_API_KEY = internalKey;
    mockVerifiedSession.mockResolvedValue({
      accessToken: 'signed-core-token',
      userId: 'core-user-123',
      username: 'Alice Smith',
      role: 'User',
      expiresAt: 4_000_000_000,
    });
    global.fetch = jest.fn();
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
    expect(options.headers).toMatchObject({
      Authorization: `Bearer ${internalKey}`,
      'X-MGCK-Core-User-Id': 'core-user-123',
      'X-MGCK-Core-Username': 'Alice%20Smith',
    });
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
    [401, 'transient'],
    [403, 'transient'],
    [503, 'transient'],
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

  test('does not contact Django without a verified Core session', async () => {
    mockVerifiedSession.mockResolvedValue(null);

    const result = await syncMilestonesAction([stored]);

    expect(result).toEqual({
      ok: false,
      kind: 'unauthenticated',
      error: 'User not logged in',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fails as retryable when internal service auth is not configured', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    delete process.env.NEXT_DJANGO_INTERNAL_API_KEY;

    const result = await syncMilestonesAction([stored]);

    expect(result).toEqual({
      ok: false,
      kind: 'transient',
      error: 'Milestone service unavailable',
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      'Milestone internal authentication is not configured'
    );
  });
});
