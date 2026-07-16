'use server';

import { API_KPOP_FOLLOWING } from '@/lib/consts/urls';
import {
  AccountFollowing,
  AccountFollowingRequest,
  AccountFollowingRequestSchema,
  AccountFollowingSchema,
} from '@/lib/types/kpop-following';
import { cookies } from 'next/headers';

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
  artists: AccountFollowingRequest[]
): Promise<AccountFollowingResult> {
  return requestFollowing('POST', '/merge', { artists });
}

export async function addAccountFollowing(
  artist: AccountFollowingRequest
): Promise<AccountFollowingResult> {
  if (!AccountFollowingRequestSchema.safeParse(artist).success) {
    return { type: 'error' };
  }
  return requestFollowing('POST', '', artist);
}

export async function removeAccountFollowing(
  artistPublicId: string
): Promise<AccountFollowingResult> {
  return requestFollowing('DELETE', `/${artistPublicId}`);
}

async function requestFollowing(
  method: 'GET' | 'POST' | 'DELETE',
  suffix = '',
  body?: unknown
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
