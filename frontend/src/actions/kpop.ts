'use server';

import { API_KPOP } from '@/lib/consts/urls';
import { ComebacksResult } from '@/lib/types';
import { validDateStringOrNull } from '@/lib/utils';

const BASE_URL = process.env.BASE_URL;

export async function fetchComebacks(formData?: FormData) {
  if (!formData) {
    formData = new FormData();
  }
  const apiUrl = new URL(`${BASE_URL}${API_KPOP}`);
  let title = formData.get('title')?.toString() || '';
  let artist = formData.get('artist')?.toString() || '';
  let start_date = formData.get('start_date')?.toString() || '';
  if (start_date) {
    start_date = validDateStringOrNull(start_date) || '';
  }
  let end_date = formData.get('end_date')?.toString() || '';
  if (end_date) {
    end_date = validDateStringOrNull(end_date) || '';
  }
  const page = formData.get('page')?.toString() || '1';
  apiUrl.searchParams.append('title', title);
  apiUrl.searchParams.append('artist', artist);
  apiUrl.searchParams.append('start_date', start_date);
  apiUrl.searchParams.append('end_date', end_date);
  apiUrl.searchParams.append('page', page);
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return data as ComebacksResult;
}
