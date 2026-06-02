import { API_KPOP } from '@/lib/consts/urls';
import { KpopQueryState, getKpopApiQuery } from '@/lib/kpop/query';
import { ComebacksResult, ComebacksResultSchema } from '@/lib/types/kpop';

const BASE_URL = process.env.BASE_URL;

export async function fetchComebacks(
  state: KpopQueryState
): Promise<ComebacksResult | string> {
  const apiQuery = getKpopApiQuery(state);
  const apiUrl = createURL(apiQuery);
  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (response.ok) {
    return parseComebacksResponse(response);
  }

  if (response.status === 404 && state.page > 1) {
    const retryResponse = await fetch(createURL({ ...apiQuery, page: '1' }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (retryResponse.ok) {
      return parseComebacksResponse(retryResponse);
    }
  }

  return response.status === 404 ? 'Page Not Found' : 'Server Error';
}

async function parseComebacksResponse(response: Response) {
  const data = await response.json();
  const parsed = ComebacksResultSchema.safeParse(data);
  if (!parsed.success) {
    return 'Server Error';
  }
  return parsed.data;
}

function createURL(query: Record<string, string>) {
  const apiUrl = new URL(`${BASE_URL}${API_KPOP}`);
  for (const [key, value] of Object.entries(query)) {
    apiUrl.searchParams.append(key, value);
  }
  return apiUrl;
}
