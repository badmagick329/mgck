'use server';

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
  // TODO Add token check
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
  // TODO handle error
  const data = await res.json();
  return data;
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
  const data = await res.json();
  return data;
}

export async function fetchAllUrls(
  username: string
): Promise<{ urls?: ShortenedUrl[]; error?: string }> {
  // TODO Add token check
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
    console.log(data);
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
