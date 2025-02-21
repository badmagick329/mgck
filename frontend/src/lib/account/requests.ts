import { AspAuthResponse } from '@/lib/types/auth';
import { cookies, headers } from 'next/headers';
import { parsedServerResponse } from './parsed-server-response';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

const fetchWithAuthHeader = async ({
  url,
  method,
  data,
  headersList,
}: {
  url: string;
  method: string;
  data?: any | undefined;
  headersList?: ReadonlyHeaders;
}): Promise<AspAuthResponse> => {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('token')?.value;
  if (!cookieToken) {
    return {
      type: 'error',
      status: 401,
      errors: [{ code: '401', description: 'Unauthorized' }],
    };
  }

  const body = data ? JSON.stringify(data) : null;

  let headers: HeadersInit = {
    ...(cookieToken ? { Authorization: `Bearer ${cookieToken}` } : {}),
  };

  if (headersList) {
    headers = {
      ...headers,
      'X-Forwarded-For': headersList.get('x-forwarded-for') || '',
      'X-Real-IP': headersList.get('x-real-ip') || '',
      'X-Forwarded-Proto': headersList.get('x-forwarded-proto') || '',
      'X-Forwarded-Host': headersList.get('x-forwarded-host') || '',
    };
  }

  const payload: RequestInit = {
    method,
    headers,
    ...(data ? { body } : {}),
  };

  const response = await fetch(new URL(url), payload);
  return await parsedServerResponse(response);
};

export { fetchWithAuthHeader };
