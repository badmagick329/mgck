'use server';

import { API_KPOP_FOLLOWING } from '@/lib/consts/urls';
import {
  AccountFollowing,
  AccountFollowingRequest,
  AccountFollowingRequestSchema,
  AccountFollowingSchema,
} from '@/lib/types/kpop-following';
import { cookies } from 'next/headers';
import { verifyCoreAccessToken } from '@/lib/account/core-token';

type AccountFollowingResult =
  | { type: 'ok'; data: AccountFollowing }
  | { type: 'unauthenticated' }
  | { type: 'limit' }
  | { type: 'error' };

const BASE_URL = process.env.CORE_API_BASE_URL;

export async function getAccountFollowing(): Promise<AccountFollowingResult> {
  return requestFollowing('GET');
}

export async function mergeAccountFollowing(
  artists: AccountFollowingRequest[],
  expectedUserId: string
): Promise<AccountFollowingResult> {
  return requestFollowing('POST', '/merge', { artists }, expectedUserId);
}

export async function addAccountFollowing(
  artist: AccountFollowingRequest,
  expectedUserId: string
): Promise<AccountFollowingResult> {
  if (!AccountFollowingRequestSchema.safeParse(artist).success) {
    return { type: 'error' };
  }
  return requestFollowing('POST', '', artist, expectedUserId);
}

export async function removeAccountFollowing(
  artistPublicId: string,
  expectedUserId: string
): Promise<AccountFollowingResult> {
  return requestFollowing(
    'DELETE',
    `/${artistPublicId}`,
    undefined,
    expectedUserId
  );
}

async function requestFollowing(
  method: 'GET' | 'POST' | 'DELETE',
  suffix = '',
  body?: unknown,
  expectedUserId?: string
): Promise<AccountFollowingResult> {
  let token: string | undefined;
  try {
    token = (await cookies()).get('token')?.value;
  } catch {
    return { type: 'unauthenticated' };
  }
  if (!token || !BASE_URL) {
    return { type: 'unauthenticated' };
  }
  if (method !== 'GET') {
    // Pending edits belong to the rendered account, even if cookies changed in another tab.
    const verification = await verifyCoreAccessToken(token);
    if (
      !verification.ok ||
      !expectedUserId ||
      verification.session.userId !== expectedUserId
    ) {
      return { type: 'unauthenticated' };
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${API_KPOP_FOLLOWING}${suffix}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (response.status === 401) {
      return { type: 'unauthenticated' };
    }
    if (response.status === 409) {
      return { type: 'limit' };
    }
    if (!response.ok) {
      return { type: 'error' };
    }
    if (method === 'DELETE') {
      return getAccountFollowing();
    }

    const parsed = AccountFollowingSchema.safeParse(await response.json());
    return parsed.success
      ? { type: 'ok', data: parsed.data }
      : { type: 'error' };
  } catch {
    return { type: 'error' };
  }
}
