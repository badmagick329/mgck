import {
  AspAuthResponse,
  aspAuthResponseSchema,
  ErrorResponse,
  errorResponseSchema,
} from '@/lib/types/auth';
import { cookies } from 'next/headers';
import { API_REFRESH } from '@/lib/consts/urls';
import { parsedServerResponse } from './parsed-server-response';
import { createErrorResponse } from '@/lib/account/errors';
import { util } from 'zod';
import assertNever = util.assertNever;

const BASE_URL = process.env.USER_AUTH_BASE_URL;

type RefreshResultBase = {
  type: 'notNeeded' | 'success';
};

type RefreshResult =
  | RefreshResultBase
  | {
      type: 'error';
      error: ErrorResponse;
    };

const fetchWithRenewIfNeeded = async ({
  url,
  method,
  data,
}: {
  url: string;
  method: string;
  data?: any | undefined;
}): Promise<AspAuthResponse> => {
  const response = await fetchWithAuthHeader({
    url,
    method,
    data,
  });
  const parsedResponse = await parsedServerResponse(response);
  const refreshResult = await tryRefreshToken(parsedResponse);

  switch (refreshResult.type) {
    case 'notNeeded':
      return parsedResponse;
    case 'error':
      return refreshResult.error;
    case 'success':
      const newResponse = await fetchWithAuthHeader({
        url,
        method,
        data,
      });
      const parsedNewResponse = await parsedServerResponse(newResponse);
      if (aspAuthResponseSchema.safeParse(parsedNewResponse).success) {
        return parsedNewResponse;
      }
      return createErrorResponse(newResponse);
    default:
      assertNever(refreshResult);
  }
};

const tryRefreshToken = async (
  parsedResponse: AspAuthResponse
): Promise<RefreshResult> => {
  const refreshNeeded =
    errorResponseSchema.safeParse(parsedResponse).success &&
    parsedResponse.status === 401;

  if (!refreshNeeded) {
    return { type: 'notNeeded' };
  }

  const refreshToken = cookies().get('refreshToken')?.value;
  const refreshResponse = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_REFRESH}`,
    method: 'POST',
    data: { refreshToken },
  });

  const parsedRefreshResponse = await parsedServerResponse(refreshResponse);
  const errorResponseParse = errorResponseSchema.safeParse(
    parsedRefreshResponse
  );
  if (errorResponseParse.success) {
    return { type: 'error', error: errorResponseParse.data };
  }
  return { type: 'success' };
};

const fetchWithAuthHeader = async ({
  url,
  method,
  data,
}: {
  url: string;
  method: string;
  data?: any | undefined;
}): Promise<Response> => {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('token')?.value;
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

  return await fetch(new URL(url), payload);
};

const makeRefreshRequest = async () => {
  const refreshToken = cookies().get('refreshToken')?.value;
  return await fetchWithAuthHeader({
    url: `${BASE_URL}${API_REFRESH}`,
    method: 'POST',
    data: { refreshToken },
  });
};

export { makeRefreshRequest, fetchWithAuthHeader, fetchWithRenewIfNeeded };
