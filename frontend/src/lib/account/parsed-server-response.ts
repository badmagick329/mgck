import { AspAuthResponse, ErrorResponse } from '@/lib/types/auth';
import { cookies } from 'next/headers';
import {
  isCredentialsErrorResponse,
  isProblemErrorResponse,
} from '@/lib/account/predicates';
import { createErrorResponse } from '@/lib/account/errors';

export async function parsedServerResponse(
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
