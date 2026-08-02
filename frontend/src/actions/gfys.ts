'use server';

import { API_GFYS, API_GFYS_RANDOM, API_GFY_ACCOUNTS, API_GFY_VIEWS } from '@/lib/consts/urls';
import {
  AccountsResponse,
  AccountsResponseSchema,
  GfyDetailResponse,
  GfyResponseSchema,
} from '@/lib/types/gfys';
import { validDateStringOrNull } from '@/lib/utils';

const BASE_URL = process.env.BASE_URL;

export async function searchGfys(formData: FormData) {
  const title = formData.get('title')?.toString() || '';
  const tags = formData.get('tags')?.toString() || '';
  let start_date = formData.get('start_date')?.toString() || '';
  if (start_date) {
    start_date = validDateStringOrNull(start_date) || '';
  }
  let end_date = formData.get('end_date')?.toString() || '';
  if (end_date) {
    end_date = validDateStringOrNull(end_date) || '';
  }
  const page = formData.get('page')?.toString() || '1';
  const sort = formData.get('sort')?.toString() || 'recent';
  let account = formData.get('account')?.toString() || '';
  if (account == 'All') {
    account = '';
  }
  const apiUrl = new URL(`${BASE_URL}${API_GFYS}`);
  apiUrl.searchParams.append('title', title);
  apiUrl.searchParams.append('tags', tags);
  apiUrl.searchParams.append('start_date', start_date);
  apiUrl.searchParams.append('end_date', end_date);
  apiUrl.searchParams.append('account', account);
  apiUrl.searchParams.append('page', page);
  apiUrl.searchParams.append('sort', sort);
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  try {
    const data = await res.json();
    const parsed = GfyResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('GfyResponseSchema validation failed', parsed.error);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function fetchRandomGfy(params: URLSearchParams) {
  const apiUrl = new URL(`${BASE_URL}${API_GFYS_RANDOM}`);
  for (const key of ['title', 'tags', 'start_date', 'end_date', 'account']) {
    const value = params.get(key);
    if (value) apiUrl.searchParams.set(key, value);
  }
  const response = await fetch(apiUrl, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.imgur_id === 'string' ? data.imgur_id : null;
}

export async function fetchGfy(videoId: string) {
  const apiUrl = new URL(`${BASE_URL}${API_GFYS}/${videoId}`);
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  try {
    const data = await res.json();
    return data as GfyDetailResponse;
  } catch (error) {
    return null;
  }
}

export async function fetchAccounts() {
  const apiUrl = new URL(`${BASE_URL}${API_GFY_ACCOUNTS}`);
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  try {
    const data = await res.json();
    const parsed = AccountsResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('AccountsResponseSchema validation failed', parsed.error);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function addGfyView(videoUrl: string) {
  const apiUrl = `${BASE_URL}${API_GFY_VIEWS}`;
  let res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoUrl }),
  });
}
