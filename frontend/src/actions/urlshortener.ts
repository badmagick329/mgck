'use server';

import { ParsedToken } from '@/lib/account/parsed-token';
import { canUseShortener } from '@/lib/account/permissions';
import { API_SHORTENER_URL, API_SHORTENER_URLS } from '@/lib/consts/urls';
import {
  ShortenedUrl,
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
}): Promise<{ url?: string; error?: string }> {
  const token = await ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_URLS}`);

  const body = JSON.stringify({
    source_url: url,
    custom_id: customCode,
    username: token.name(),
  });
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  try {
    const data = await res.json();
    revalidateTag('shortened-urls');
    return data;
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
  const token = await ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_URLS}`);
  apiUrl.searchParams.append('username', token.name());

  let res = await fetch(apiUrl, { next: { tags: ['shortened-urls'] } });
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
  const token = await ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_URL}${code}`);
  apiUrl.searchParams.append('username', token.name());

  const res = await fetch(apiUrl, { method: 'DELETE' });
  if (!res.ok) {
    return {
      error: 'Failed to delete shortened url',
    };
  }
  revalidateTag('shortened-urls');
  return {};
}
