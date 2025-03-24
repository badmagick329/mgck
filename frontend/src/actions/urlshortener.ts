'use server';

import {
  API_SHORTENER_SHORTEN,
  API_SHORTENER_SHORTENED,
} from '@/lib/consts/urls';

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
