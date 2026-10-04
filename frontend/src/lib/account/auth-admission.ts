import { createHash } from 'node:crypto';
import { getTrustedClient } from '@/lib/utils/trusted-client';
import { RateLimit } from '@/lib/utils/rate-limit';
import { ErrorResponse } from '@/lib/types/account';
import 'server-only';

const loginClient = new RateLimit(10, 60, 'auth:login:client:');
const loginAccountClient = new RateLimit(5, 60, 'auth:login:account-client:');
const loginAggregate = new RateLimit(60, 60, 'auth:login:aggregate:');
const registrationClient = new RateLimit(3, 3600, 'auth:registration:client:');
const registrationAggregate = new RateLimit(
  10,
  3600,
  'auth:registration:aggregate:'
);

export async function admitAuthentication(
  operation: 'login' | 'registration',
  username: string
): Promise<ErrorResponse | undefined> {
  const client = await getTrustedClient();
  if (!client) return unavailableClient();
  const clientKey = createHash('sha256').update(client).digest('hex');
  const checks: [RateLimit, string][] =
    operation === 'login'
      ? [
          [loginClient, clientKey],
          [
            loginAccountClient,
            createHash('sha256')
              .update(
                JSON.stringify([client, username.normalize().toUpperCase()])
              )
              .digest('hex'),
          ],
          [loginAggregate, 'all'],
        ]
      : [
          [registrationClient, clientKey],
          [registrationAggregate, 'all'],
        ];
  for (const [limiter, key] of checks) {
    const result = await limiter.tryIncrementAndGetCount(key);
    if (!result.success)
      return {
        type: 'error',
        status: 429,
        errors: [
          {
            code: '429',
            description:
              'Too many authentication attempts. Please try again later.',
          },
        ],
      };
  }
}

function unavailableClient(): ErrorResponse {
  return {
    type: 'error',
    status: 503,
    errors: [
      {
        code: '503',
        description: 'Authentication is temporarily unavailable.',
      },
    ],
  };
}
