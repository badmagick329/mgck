'use server';

import {
  isCredentialsErrorResponse,
  isProblemErrorResponse,
} from '@/lib/auth/predicates';
import {
  API_AUTH_STATUS,
  API_LOGIN,
  API_REFRESH,
  API_REGISTER,
} from '@/lib/consts/urls';
import { ErrorResponse, ServerResponse } from '@/lib/types/auth';
import { cookies } from 'next/headers';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function userAuthStatusAction(): Promise<ServerResponse> {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('token')?.value;

  const url = new URL(`${BASE_URL}${API_AUTH_STATUS}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cookieToken}`,
    },
  });

  const error = await errorsFromResponse(response);
  if (error !== null) {
    return error;
  }

  return { type: 'success', message: 'ok', status: response.status };
}

export async function loginUserAction(payload: {
  username: string;
  password: string;
}): Promise<ServerResponse> {
  const url = new URL(`${BASE_URL}${API_LOGIN}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await responseWithMessageOrError(response);
}

export async function renewTokensAction(): Promise<ServerResponse> {
  const url = new URL(`${BASE_URL}${API_REFRESH}`);
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('refreshToken')?.value;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: cookieToken }),
  });

  return await responseWithMessageOrError(response);
}

export async function registerUserAction(payload: {
  username: string;
  password: string;
}): Promise<ServerResponse> {
  const url = new URL(`${BASE_URL}${API_REGISTER}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await responseWithMessageOrError(response);
}

async function responseWithMessageOrError(
  response: Response
): Promise<ServerResponse> {
  const errorResponse = await errorsFromResponse(response);
  if (errorResponse !== null) {
    if (!errorResponse.errors) {
      throw new Error('No errors found in error response');
    }
    return errorResponse;
  }

  try {
    const data = await response.json();
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
    }
    return {
      type: 'success',
      message: data.message || '',
      status: response.status,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        type: 'error',
        status: response.status,
        errors: [
          { code: response.status.toString(), description: 'Server error' },
        ],
      };
    }

    return {
      type: 'error',
      status: response.status,
      errors: [
        {
          code: response.status.toString(),
          description: 'Unknown Server error',
        },
      ],
    };
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
        // TODO: Implement
        return {
          type: 'error',
          status: response.status,
          errors: data.errors,
        };
      }

      return {
        type: 'error',
        status: response.status,
        errors: [{ code: response.status.toString(), description: '' }],
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return {
          type: 'error',
          status: response.status,
          errors: [{ code: response.status.toString(), description: '' }],
        };
      }

      return {
        type: 'error',
        status: response.status,
        errors: [
          { code: response.status.toString(), description: 'Server error' },
        ],
      };
    }
  }
  return null;
}
