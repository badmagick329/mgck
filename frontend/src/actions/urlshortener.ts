'use server';

import {
  getCurrentCoreSession,
  getVerifiedCoreSession,
} from '@/lib/account/verified-session';
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
  // fetch sits inside the try so an unreachable Django becomes an { error }
  // the form can show, not a rejection the caller never sees.
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authentication,
      },
      body,
    });
    const data = await res.json();
    revalidateTag('shortened-urls');
    const record = shortenedUrlSchema.safeParse(data.record);
    return record.success
      ? { url: data.url, record: record.data }
      : { error: 'Invalid shortened URL response' };
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
  // Left to throw on purpose: an { error } here makes the redirect page answer
  // a Django outage with notFound(), telling visitors and crawlers the link is gone.
  const res = await fetch(apiUrl);
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

  // Inside the try so an unreachable Django renders the failed-load state on
  // /shorten and /account/home instead of their error boundary.
  try {
    const res = await fetch(apiUrl, {
      headers: authentication,
      cache: 'no-store',
    });
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
  const apiUrl = new URL(
    `${BASE_URL}${INTERNAL_SHORTENER_URL}url/${encodeURIComponent(code)}`
  );

  const failure = { error: 'Failed to delete shortened url' };
  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: 'DELETE',
      headers: authentication,
    });
  } catch (e) {
    // Report an unreachable Django like a refused delete so the dialog shows it.
    console.error(e);
    return failure;
  }
  if (!res.ok) return failure;
  revalidateTag('shortened-urls');
  return {};
}

/**
 * Django's owner routes trust Next for shortener permission and check no role,
 * so the permission is rechecked here against Core's current role: a demoted
 * user's still-valid access token must not reach Django.
 */
async function getShortenerAuthenticationHeaders() {
  const session = await getCurrentCoreSession();
  const internalKey = process.env.NEXT_DJANGO_INTERNAL_API_KEY;
  if (
    !canUseShortener(session) ||
    !session ||
    !internalKey ||
    internalKey.length < 32
  )
    return null;
  return {
    Authorization: `Bearer ${internalKey}`,
    'X-MGCK-Core-User-Id': encodeURIComponent(session.userId),
    'X-MGCK-Core-Username': encodeURIComponent(session.username),
  };
}
