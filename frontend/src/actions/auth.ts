'use server';

import {
  API_AUTH_STATUS,
  API_LOGIN,
  API_REFRESH,
  API_REGISTER,
} from '@/lib/consts/urls';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function fetchUserStatus({
  token,
}: {
  token: string;
}): Promise<ServerResponse> {
  const url = new URL(`${BASE_URL}${API_AUTH_STATUS}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const error = await errorsFromResponse(response);
  if (error !== null) {
    return error;
  }

  return { type: 'success' };
}

export async function requestLogin(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const url = new URL(`${BASE_URL}${API_LOGIN}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await responseWithTokensOrError(response);
}

export async function fetchNewTokens({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<LoginResponse | ErrorResponse> {
  const url = new URL(`${BASE_URL}${API_REFRESH}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: refreshToken }),
  });

  return await responseWithTokensOrError(response);
}

export async function requestRegistration(payload: {
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

async function responseWithTokensOrError(
  response: Response
): Promise<LoginResponse> {
  const errorResponse = await errorsFromResponse(response);
  if (errorResponse !== null) {
    if (!errorResponse.errors) {
      throw new Error('No errors found in response');
    }
    console.log(stringifyErrors(errorResponse.errors));
    return errorResponse;
  }

  try {
    const data = await response.json();
    console.log(`returning success`);
    console.log(JSON.stringify(data, null, 2));
    return {
      type: 'success',
      data: {
        token: data.token,
        refreshToken: data.refreshToken,
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        type: 'error',
        errors: [{ code: '500', description: 'Server error' }],
      };
    }

    return {
      type: 'error',
      errors: [{ code: '', description: 'Unknown Server error' }],
    };
  }
}

async function responseWithMessageOrError(
  response: Response
): Promise<ServerResponse> {
  const errorResponse = await errorsFromResponse(response);
  if (errorResponse !== null) {
    if (!errorResponse.errors) {
      throw new Error('No errors found in response');
    }
    console.log(stringifyErrors(errorResponse.errors));
    return errorResponse;
  }

  try {
    const data = await response.json();
    console.log(`returning success`);
    console.log(JSON.stringify(data, null, 2));
    return {
      type: 'success',
      message: data.message || '',
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        type: 'error',
        errors: [{ code: '500', description: 'Server error' }],
      };
    }

    return {
      type: 'error',
      errors: [{ code: '', description: 'Unknown Server error' }],
    };
  }
}

async function errorsFromResponse(
  response: Response
): Promise<ErrorResponse | null> {
  if (response.status !== 200) {
    try {
      const data = await response.json();
      console.log('printing error:');
      console.log(JSON.stringify(data, null, 2));
      return {
        type: 'error',
        errors: data,
      };
    } catch (error) {
      return {
        type: 'error',
        errors: [{ code: response.status.toString(), description: '' }],
      };
    }
  }
  return null;
}

function stringifyErrors(errors: ApiError[]) {
  return errors
    .map((error) => `${error.code}: ${error.description}`)
    .join(', ');
}
