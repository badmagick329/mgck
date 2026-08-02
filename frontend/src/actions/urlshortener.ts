'use server';

import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { canUseShortener } from '@/lib/account/permissions';
import { API_SHORTENER_URL, INTERNAL_SHORTENER_URL } from '@/lib/consts/urls';
import {
  ShortenedUrl,
  shortenedUrlSchema,
  shortenedUrlsByUsernameSchema,
} from '@/lib/types/shorten';
import { revalidateTag } from 'next/cache';

const BASE_URL = process.env.BASE_URL;

export async function createShortenedUrl({
  url,
  customCode,
}: {
  url: string;
  customCode: string;
}): Promise<{ url?: string; record?: ShortenedUrl; error?: string }> {
  const session = await getVerifiedCoreSession();
  if (!canUseShortener(session)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const authentication = await getShortenerAuthenticationHeaders();
  if (!authentication) return { error: 'Shortener service unavailable' };
  const apiUrl = new URL(`${BASE_URL}${INTERNAL_SHORTENER_URL}urls`);

  const body = JSON.stringify({
    source_url: url,
    custom_id: customCode,
  });
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', ...authentication,
    },
    body,
  });
  try {
    const data = await res.json();
    revalidateTag('shortened-urls');
    const record = shortenedUrlSchema.safeParse(data.record);
    return record.success ? { url: data.url, record: record.data } : { error: 'Invalid shortened URL response' };
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to shorten url',
    };
  }
}

export async function getShortenedUrl(
  code: string
): Promise<{ url?: string; error?: string }> {
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_URL}${code}`);
  let res = await fetch(apiUrl);
  try {
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to fetch shortened url',
    };
  }
}

export async function getAllShortenedUrls(): Promise<{
  urls?: ShortenedUrl[];
  error?: string;
}> {
  const session = await getVerifiedCoreSession();
  if (!canUseShortener(session)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const authentication = await getShortenerAuthenticationHeaders();
  if (!authentication) return { error: 'Shortener service unavailable' };
  const apiUrl = new URL(`${BASE_URL}${INTERNAL_SHORTENER_URL}urls`);

  let res = await fetch(apiUrl, { headers: authentication, cache: 'no-store' });
  try {
    const data = await res.json();
    const parsed = shortenedUrlsByUsernameSchema.safeParse(data);
    if (!parsed.success) {
      return {
        error: 'Failed to parse shortened urls',
      };
    }

    return { urls: parsed.data };
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to fetch shortened urls',
    };
  }
}

export async function deleteShortenedUrl({
  code,
}: {
  code: string;
}): Promise<{ error?: string }> {
  const session = await getVerifiedCoreSession();
  if (!canUseShortener(session)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const authentication = await getShortenerAuthenticationHeaders();
  if (!authentication) return { error: 'Shortener service unavailable' };
  const apiUrl = new URL(`${BASE_URL}${INTERNAL_SHORTENER_URL}url/${encodeURIComponent(code)}`);

  const res = await fetch(apiUrl, { method: 'DELETE', headers: authentication });
  if (!res.ok) {
    return {
      error: 'Failed to delete shortened url',
    };
  }
  revalidateTag('shortened-urls');
  return {};
}

async function getShortenerAuthenticationHeaders(): Promise<Record<string, string> | null> {
  const session = await getVerifiedCoreSession();
  const internalKey = process.env.NEXT_DJANGO_INTERNAL_API_KEY;
  if (!session || !internalKey || internalKey.length < 32) return null;
  return {
    Authorization: `Bearer ${internalKey}`,
    'X-MGCK-Core-User-Id': encodeURIComponent(session.userId),
    'X-MGCK-Core-Username': encodeURIComponent(session.username),
  };
}
