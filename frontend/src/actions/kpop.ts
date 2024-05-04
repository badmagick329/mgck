'use server';

import { API_KPOP } from '@/lib/consts/urls';
import { ComebacksResult, ServerError } from '@/lib/types';
import { validDateStringOrNull } from '@/lib/utils';

const BASE_URL = process.env.BASE_URL;

export async function fetchComebacks(
  formData?: FormData
): Promise<ComebacksResult | ServerError> {
  if (!formData) {
    formData = new FormData();
  }
  const { title, artist, startDate, endDate, page, exact } =
    preparedFormValues(formData);
  const apiUrl = createURL(title, artist, startDate, endDate, page, exact);

  const res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (res.ok) {
    const data = await res.json();
    // TODO: Validation
    return data as ComebacksResult;
  } else {
    if (res.status >= 500) {
      return 'Server Error';
    } else if (res.status === 404) {
      return 'Page Not Found';
    } else {
      return 'Unknown Error';
    }
  }
}

function preparedFormValues(formData: FormData) {
  let title = formData.get('title')?.toString() || '';
  let artist = formData.get('artist')?.toString() || '';
  let startDate = formData.get('start-date')?.toString() || '';
  if (startDate) {
    startDate = validDateStringOrNull(startDate) || '';
  }
  let endDate = formData.get('end-date')?.toString() || '';
  if (endDate) {
    endDate = validDateStringOrNull(endDate) || '';
  }
  let page = formData.get('page')?.toString() || '1';
  let exact = Boolean(formData.get('exact')) ? 'on' : '';
  return {
    title,
    artist,
    startDate,
    endDate,
    page,
    exact,
  };
}

function createURL(
  title: string,
  artist: string,
  startDate: string,
  endDate: string,
  page: string,
  exact: string
) {
  const apiUrl = new URL(`${BASE_URL}${API_KPOP}`);
  apiUrl.searchParams.append('title', title);
  apiUrl.searchParams.append('artist', artist);
  apiUrl.searchParams.append('start_date', startDate);
  apiUrl.searchParams.append('end_date', endDate);
  apiUrl.searchParams.append('page', page);
  apiUrl.searchParams.append('exact', exact);
  return apiUrl;
}
