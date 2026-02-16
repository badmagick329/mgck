/**
 * @jest-environment node
 */

const mockRedisConnect = jest.fn();
const mockRedisPing = jest.fn();
const mockRedisQuit = jest.fn();
const mockRedisDisconnect = jest.fn();

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    connect: mockRedisConnect,
    ping: mockRedisPing,
    quit: mockRedisQuit,
    disconnect: mockRedisDisconnect,
  })),
}));

import { GET } from '@/app/healthz/route';

const originalEnv = process.env;

describe('/healthz route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.BASE_URL = 'http://djangobackend:8002';
    process.env.CORE_API_BASE_URL = 'http://coreapi:5010';
    process.env.REDIS_URL = 'redis://redis:6379';

    global.fetch = jest.fn();
    mockRedisConnect.mockResolvedValue(undefined);
    mockRedisPing.mockResolvedValue('PONG');
    mockRedisQuit.mockResolvedValue('OK');
    mockRedisDisconnect.mockReturnValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns 200 with ok when all dependencies are healthy', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate'
    );
    expect(data.status).toBe('ok');
    expect(data.services.django.status).toBe('up');
    expect(data.services.coreapi.status).toBe('up');
    expect(data.services.redis.status).toBe('up');
    expect(data.services.redis.result).toBe('PONG');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('returns 503 when core api check returns non-2xx', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 500 }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.django.status).toBe('up');
    expect(data.services.coreapi.status).toBe('down');
    expect(data.services.coreapi.httpStatus).toBe(500);
    expect(data.services.coreapi.error).toBe('http_500');
    expect(data.services.redis.status).toBe('up');
  });

  test('returns 503 when redis ping fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    mockRedisPing.mockRejectedValueOnce(new Error('redis down'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.redis.status).toBe('down');
    expect(data.services.redis.error).toBe('redis down');
    expect(mockRedisQuit).toHaveBeenCalledTimes(1);
  });

  test('returns timeout error when django fetch aborts', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.services.django.status).toBe('down');
    expect(data.services.django.error).toBe('timeout');
    expect(data.services.coreapi.status).toBe('up');
  });

  test('returns missing_env when core api env var is absent', async () => {
    delete process.env.CORE_API_BASE_URL;
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('{}', { status: 200 })
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.coreapi.status).toBe('down');
    expect(data.services.coreapi.error).toBe('missing_env');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
