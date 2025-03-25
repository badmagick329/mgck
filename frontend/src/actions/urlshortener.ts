'use server';

import { ParsedToken } from '@/lib/account/parsed-token';
import { canUseShortener } from '@/lib/account/permissions';
import {
  API_SHORTENER_SHORTEN,
  API_SHORTENER_SHORTENED,
  API_SHORTENER_URLS,
} from '@/lib/consts/urls';
import {
  ShortenedUrl,
  shortenedUrlsByUsernameSchema,
} from '@/lib/types/shorten';

const BASE_URL = process.env.BASE_URL;

export async function shortenUrl({
  url,
  customCode,
  username,
}: {
  url: string;
  customCode: string;
  username: string;
}): Promise<{ url?: string; error?: string }> {
  const token = ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_SHORTEN}`);
  const body = JSON.stringify({
    source_url: url,
    custom_id: customCode,
    username,
  });
  let res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  try {
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to shorten url',
    };
  }
}

export async function fetchShortenedUrl(
  code: string
): Promise<{ url?: string; error?: string }> {
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_SHORTENED}${code}`);
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
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

export async function fetchAllUrls(
  username: string
): Promise<{ urls?: ShortenedUrl[]; error?: string }> {
  const token = ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    return {
      error: 'You do not have permission to use the URL shortener',
    };
  }
  const apiUrl = new URL(`${BASE_URL}${API_SHORTENER_URLS}`);
  let res = await fetch(apiUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });
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
