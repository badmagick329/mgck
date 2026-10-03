import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { headers } from 'next/headers';
import { RateLimit } from '@/lib/utils/rate-limit';
import { ErrorResponse } from '@/lib/types/account';
import 'server-only';

const loginClient = new RateLimit(10, 60, 'auth:login:client:', false);
const loginAccountClient = new RateLimit(
  5,
  60,
  'auth:login:account-client:',
  false
);
const loginAggregate = new RateLimit(60, 60, 'auth:login:aggregate:', false);
const registrationClient = new RateLimit(
  3,
  3600,
  'auth:registration:client:',
  false
);
const registrationAggregate = new RateLimit(
  10,
  3600,
  'auth:registration:aggregate:',
  false
);

export async function admitAuthentication(
  operation: 'login' | 'registration',
  username: string
): Promise<ErrorResponse | undefined> {
  const requestHeaders = await headers();
  // Dokploy's Traefik is the immediate ingress and appends the network peer.
  // Ignore caller-prepended addresses. Aggregate limits remain authoritative
  // even if upstream forwarding trust is accidentally misconfigured.
  const client = requestHeaders
    .get('x-forwarded-for')
    ?.split(',')
    .at(-1)
    ?.trim();
  if (!client || !isIP(client)) return unavailableClient();
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
