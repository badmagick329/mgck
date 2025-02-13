'use server';

import {
  isCredentialsErrorResponse,
  isErrorResponse,
  isMessageResponse,
  isProblemErrorResponse,
  isRoleResponse,
} from '@/lib/account/predicates';
import {
  API_AUTH_STATUS,
  API_LOGIN,
  API_REFRESH,
  API_REGISTER,
  API_USER_ROLE,
} from '@/lib/consts/urls';
import {
  AspAuthResponse,
  ErrorResponse,
  MessageResponse,
  RoleResponse,
} from '@/lib/types/auth';
import { cookies } from 'next/headers';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function userAuthStatusAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const response = await fetchWithAuthHeader({
    endpoint: `${BASE_URL}${API_AUTH_STATUS}`,
    method: 'POST',
  });

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function userRoleAction(): Promise<RoleResponse | ErrorResponse> {
  const response = await fetchWithAuthHeader({
    endpoint: `${BASE_URL}${API_USER_ROLE}`,
    method: 'GET',
  });

  const parsedResponse = await parsedServerResponse(response);
  if (isRoleResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function loginUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const response = await fetchWithAuthHeader({
    endpoint: `${BASE_URL}${API_LOGIN}`,
    method: 'POST',
    data: payload,
  });
  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function renewTokensAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const refreshToken = cookies().get('refreshToken')?.value;

  const response = await fetchWithAuthHeader({
    endpoint: `${BASE_URL}${API_REFRESH}`,
    method: 'POST',
    data: { refreshToken },
  });

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function registerUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const url = new URL(`${BASE_URL}${API_REGISTER}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

async function parsedServerResponse(
  response: Response
): Promise<AspAuthResponse> {
  const errorResponse = await errorsFromResponse(response);
  if (errorResponse !== null) {
    if (!errorResponse.errors) {
      throw new Error('No errors found in error response');
    }
    return errorResponse;
  }

  try {
    const data = await response.json();
    let cleanedData;
    if (data?.token && data?.refreshToken) {
      const cookieStore = cookies();
      cookieStore.set({
        name: 'token',
        value: data.token,
        httpOnly: true,
      });
      cookieStore.set({
        name: 'refreshToken',
        value: data.refreshToken,
        httpOnly: true,
      });
      cleanedData = { message: 'Received new tokens' };
    } else {
      cleanedData = data;
    }

    return {
      type: 'success',
      status: response.status,
      data: cleanedData,
    };
  } catch (error) {
    return createErrorResponse(response);
  }
}

async function errorsFromResponse(
  response: Response
): Promise<ErrorResponse | null> {
  if (response.status !== 200) {
    try {
      const data = await response.json();
      if (isCredentialsErrorResponse(data)) {
        return {
          type: 'error',
          status: response.status,
          errors: data,
        };
      }

      if (isProblemErrorResponse(data)) {
        return {
          type: 'error',
          status: response.status,
          errors: data.errors,
        };
      }

      return createErrorResponse(response);
    } catch (error) {
      return createErrorResponse(response);
    }
  }
  return null;
}

async function fetchWithAuthHeader({
  endpoint,
  method,
  data,
}: {
  endpoint: string;
  method: string;
  data?: any | undefined;
}): Promise<Response> {
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

  return await fetch(new URL(endpoint), payload);
}

function createErrorResponse(response?: Response): ErrorResponse {
  return {
    type: 'error',
    status: response?.status || 500,
    errors: [
      {
        code: response?.status.toString() || '500',
        description: response?.statusText || 'Unknown server error',
      },
    ],
  };
}
