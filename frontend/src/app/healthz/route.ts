import Redis from 'ioredis';
import { Client } from 'pg';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHECK_TIMEOUT_MS = 2000;
const DJANGO_HEALTH_PATH = '/milestones_api/?username=__healthz__';
const CORE_API_HEALTH_PATH = '/api/feedback';

type ServiceStatus = 'up' | 'down';

type HttpServiceHealth = {
  status: ServiceStatus;
  latencyMs: number;
  httpStatus?: number;
  error?: string;
};

type RedisServiceHealth = {
  status: ServiceStatus;
  latencyMs: number;
  result?: string;
  error?: string;
};

type HealthResponse = {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    django: HttpServiceHealth;
    coreapi: HttpServiceHealth;
    redis: RedisServiceHealth;
    postgresDjango: DataServiceHealth;
    postgresCore: DataServiceHealth;
  };
};

type DataServiceHealth = {
  status: ServiceStatus;
  latencyMs: number;
  result?: string;
  error?: string;
};

type PostgresConfig = {
  host: string | undefined;
  port: string | undefined;
  database: string | undefined;
  user: string | undefined;
  password: string | undefined;
};

export async function GET() {
  const [django, coreapi, redis, postgresDjango, postgresCore] =
    await Promise.all([
    checkHttpService(process.env.BASE_URL, DJANGO_HEALTH_PATH),
    checkHttpService(process.env.CORE_API_BASE_URL, CORE_API_HEALTH_PATH),
    checkRedis(process.env.REDIS_URL),
    checkPostgres({
      host: process.env.HEALTH_DJANGO_DB_HOST,
      port: process.env.HEALTH_DJANGO_DB_PORT,
      database: process.env.HEALTH_DJANGO_DB_NAME,
      user: process.env.HEALTH_DJANGO_DB_USER,
      password: process.env.HEALTH_DJANGO_DB_PASSWORD,
    }),
    checkPostgres({
      host: process.env.HEALTH_CORE_DB_HOST,
      port: process.env.HEALTH_CORE_DB_PORT,
      database: process.env.HEALTH_CORE_DB_NAME,
      user: process.env.HEALTH_CORE_DB_USER,
      password: process.env.HEALTH_CORE_DB_PASSWORD,
    }),
    ]);

  const allHealthy =
    django.status === 'up' &&
    coreapi.status === 'up' &&
    redis.status === 'up' &&
    postgresDjango.status === 'up' &&
    postgresCore.status === 'up';

  const body: HealthResponse = {
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: { django, coreapi, redis, postgresDjango, postgresCore },
  };

  return NextResponse.json(body, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

async function checkHttpService(
  baseUrl: string | undefined,
  path: string
): Promise<HttpServiceHealth> {
  if (!baseUrl) {
    return {
      status: 'down',
      latencyMs: 0,
      error: 'missing_env',
    };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  const url = new URL(path, baseUrl);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    return {
      status: response.ok ? 'up' : 'down',
      latencyMs,
      httpStatus: response.status,
      ...(response.ok ? {} : { error: `http_${response.status}` }),
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      status: 'down',
      latencyMs,
      error: asErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRedis(redisUrl: string | undefined): Promise<RedisServiceHealth> {
  if (!redisUrl) {
    return {
      status: 'down',
      latencyMs: 0,
      error: 'missing_env',
    };
  }

  const start = Date.now();
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    connectTimeout: CHECK_TIMEOUT_MS,
    commandTimeout: CHECK_TIMEOUT_MS,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
  });

  try {
    await withTimeout(() => redis.connect(), CHECK_TIMEOUT_MS);
    const pingResult = await withTimeout(() => redis.ping(), CHECK_TIMEOUT_MS);
    const latencyMs = Date.now() - start;

    if (pingResult !== 'PONG') {
      return {
        status: 'down',
        latencyMs,
        result: pingResult,
        error: 'unexpected_ping_response',
      };
    }

    return {
      status: 'up',
      latencyMs,
      result: pingResult,
    };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      error: asErrorMessage(error),
    };
  } finally {
    try {
      await withTimeout(() => redis.quit(), CHECK_TIMEOUT_MS);
    } catch {
      redis.disconnect();
    }
  }
}

async function checkPostgres(config: PostgresConfig): Promise<DataServiceHealth> {
  const hasAllFields =
    !!config.host &&
    !!config.port &&
    !!config.database &&
    !!config.user &&
    !!config.password;
  if (!hasAllFields) {
    return {
      status: 'down',
      latencyMs: 0,
      error: 'missing_env',
    };
  }

  const client = new Client({
    host: config.host,
    port: Number(config.port),
    database: config.database,
    user: config.user,
    password: config.password,
    connectionTimeoutMillis: CHECK_TIMEOUT_MS,
  });

  const start = Date.now();
  try {
    await withTimeout(() => client.connect(), CHECK_TIMEOUT_MS);
    await withTimeout(() => client.query('SELECT 1'), CHECK_TIMEOUT_MS);
    return {
      status: 'up',
      latencyMs: Date.now() - start,
      result: 'SELECT 1 ok',
    };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      error: asErrorMessage(error),
    };
  } finally {
    try {
      await withTimeout(() => client.end(), CHECK_TIMEOUT_MS);
    } catch {
      //
    }
  }
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function asErrorMessage(error: unknown): string {
  if (isAbortError(error)) {
    return 'timeout';
  }
  if (error instanceof Error) {
    if (error.message === 'timeout') {
      return 'timeout';
    }
    return error.message || 'unknown_error';
  }
  return 'unknown_error';
}

function isAbortError(error: unknown) {
  return !!error && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
}
