import { AspAuthResponse } from '@/lib/types/account';
import { cookies } from 'next/headers';
import { parsedServerResponse } from './parsed-server-response';

const fetchWithAuthHeader = async ({
  url,
  method,
  data,
}: {
  url: string;
  method: string;
  data?: any | undefined;
}): Promise<AspAuthResponse> => {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('token')?.value;
  if (!cookieToken) {
    return {
      type: 'error',
      status: 401,
      errors: [{ code: '401', description: 'Unauthorized' }],
    };
  }

  const body = data ? JSON.stringify(data) : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(cookieToken ? { Authorization: `Bearer ${cookieToken}` } : {}),
  };

  const payload: RequestInit = {
    method,
    headers,
    ...(data ? { body } : {}),
  };

  const response = await fetch(new URL(url), payload);
  return await parsedServerResponse(response);
};

export { fetchWithAuthHeader };
