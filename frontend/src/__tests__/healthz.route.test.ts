/**
 * @jest-environment node
 */

const mockRedisConnect = jest.fn();
const mockRedisPing = jest.fn();
const mockRedisQuit = jest.fn();
const mockRedisDisconnect = jest.fn();

type MockPgClient = {
  config: any;
  connect: jest.Mock;
  query: jest.Mock;
  end: jest.Mock;
  on: jest.Mock;
};

const mockPgClients: MockPgClient[] = [];
const mockPgFailureByHost: Record<string, string> = {};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    connect: mockRedisConnect,
    ping: mockRedisPing,
    quit: mockRedisQuit,
    disconnect: mockRedisDisconnect,
    on: jest.fn(),
  })),
}));

jest.mock('pg', () => ({
  __esModule: true,
  Client: jest.fn().mockImplementation((config) => {
    const client: MockPgClient = {
      config,
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockImplementation(() => {
        const failure = mockPgFailureByHost[config.host];
        if (failure) {
          return Promise.reject(new Error(failure));
        }
        return Promise.resolve({ rows: [{ '?column?': 1 }] });
      }),
      end: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };
    mockPgClients.push(client);
    return client;
  }),
}));

let GET: typeof import('@/app/healthz/route').GET;

const originalEnv = process.env;

describe('/healthz route', () => {
  beforeEach(() => {
    jest.resetModules();
    GET = require('../app/healthz/route').GET;
    jest.clearAllMocks();
    mockPgClients.length = 0;
    Object.keys(mockPgFailureByHost).forEach(
      (k) => delete mockPgFailureByHost[k]
    );

    process.env = { ...originalEnv };
    process.env.BASE_URL = 'http://djangobackend:8002';
    process.env.CORE_API_BASE_URL = 'http://coreapi:5010';
    process.env.REDIS_URL = 'redis://redis:6379';
    process.env.HEALTH_DJANGO_DB_HOST = 'db';
    process.env.HEALTH_DJANGO_DB_PORT = '5432';
    process.env.HEALTH_DJANGO_DB_NAME = 'badmagick';
    process.env.HEALTH_DJANGO_DB_USER = 'badmagick';
    process.env.HEALTH_DJANGO_DB_PASSWORD = 'dbpw';
    process.env.HEALTH_CORE_DB_HOST = 'core_db';
    process.env.HEALTH_CORE_DB_PORT = '5432';
    process.env.HEALTH_CORE_DB_NAME = 'badmagick';
    process.env.HEALTH_CORE_DB_USER = 'badmagick';
    process.env.HEALTH_CORE_DB_PASSWORD = 'corepw';

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
    expect(data.services.postgresDjango.status).toBe('up');
    expect(data.services.postgresCore.status).toBe('up');
    expect(data.services.redis.result).toBe('PONG');
    expect(data.services.postgresDjango.result).toBe('SELECT 1 ok');
    expect(data.services.postgresCore.result).toBe('SELECT 1 ok');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      new URL('http://djangobackend:8002/health/'),
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      new URL('http://coreapi:5010/healthz'),
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
    expect(mockPgClients.length).toBe(2);
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
    expect(data.services.redis.error).toBe('unavailable');
    expect(mockRedisDisconnect).toHaveBeenCalledTimes(1);
  });

  test('returns 503 when django database check fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    mockPgFailureByHost.db = 'connect ECONNREFUSED';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.postgresDjango.status).toBe('down');
    expect(data.services.postgresDjango.error).toBe('unavailable');
    expect(data.services.postgresCore.status).toBe('up');
  });

  test('returns 503 when core database check times out', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    mockPgFailureByHost.core_db = 'timeout';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.services.postgresCore.status).toBe('down');
    expect(data.services.postgresCore.error).toBe('timeout');
  });

  test('returns missing_env when one db env var is absent', async () => {
    delete process.env.HEALTH_CORE_DB_PASSWORD;
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.postgresCore.status).toBe('down');
    expect(data.services.postgresCore.error).toBe('missing_env');
    expect(data.services.postgresDjango.status).toBe('up');
    expect(mockPgClients.length).toBe(1);
  });

  test('concurrent and repeated probes share one dependency snapshot', async () => {
    let release!: (value: Response) => void;
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          release = resolve;
        })
      )
      .mockResolvedValue(new Response('{}'));
    const probes = Array.from({ length: 20 }, () => GET());
    expect(fetch).toHaveBeenCalledTimes(2);
    release(new Response('{}'));
    const responses = await Promise.all(probes);
    const first = await responses[0].json();
    expect(await (await GET()).json()).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockPgClients).toHaveLength(2);
    expect(mockRedisConnect).toHaveBeenCalledTimes(1);
  });

  test('caches failures, sanitizes diagnostics, then rechecks after 30 seconds', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('http://internal-user:secret@private-host failed')
    );
    mockPgFailureByHost.db = 'private database SQL connection error';
    mockRedisPing.mockRejectedValue(new Error('redis://user:secret@internal'));
    try {
      const first = await GET();
      expect(first.status).toBe(503);
      const body = await first.text();
      expect(body).not.toMatch(/secret|private-host|internal-user|SQL/);
      expect((await GET()).status).toBe(503);
      expect(fetch).toHaveBeenCalledTimes(2);

      clock.mockReturnValue(31_001);
      (global.fetch as jest.Mock).mockResolvedValue(new Response('{}'));
      delete mockPgFailureByHost.db;
      mockRedisPing.mockResolvedValue('PONG');
      expect((await GET()).status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(mockPgClients).toHaveLength(4);
    } finally {
      clock.mockRestore();
    }
  });

  test('malformed dependency URL yields a sanitized readiness failure', async () => {
    process.env.BASE_URL = 'invalid-url';
    (global.fetch as jest.Mock).mockResolvedValue(new Response('{}'));
    const response = await GET();
    expect(response.status).toBe(503);
    expect((await response.json()).services.django.error).toBe('unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
