'use server';

import { API_KPOP } from '@/lib/consts/urls';
import { ComebacksResult } from '@/lib/types';

const BASE_URL = process.env.BASE_URL;

export async function fetchComebacks() {
  const apiUrl = new URL(`${BASE_URL}${API_KPOP}`);
  apiUrl.searchParams.append('start_date', '2024-04-01');
  let res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return data as ComebacksResult;
}
