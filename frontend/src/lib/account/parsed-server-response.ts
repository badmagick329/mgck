import { cookies } from 'next/headers';
import {
  AspAuthResponse,
  credentialsErrorResponseSchema,
  ErrorResponse,
  problemErrorResponseSchema,
} from '@/lib/types/auth';
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
    if (response.status < 400) {
      return {
        status: response.status,
        type: 'success',
        data: { message: response.statusText },
      };
    }
    return createErrorResponse(response);
  }
}

async function errorsFromResponse(
  response: Response
): Promise<ErrorResponse | null> {
  if ([200, 201, 204].includes(response.status)) return null;

  try {
    const data = await response.json();

    if (credentialsErrorResponseSchema.safeParse(data).success) {
      return {
        type: 'error',
        status: response.status,
        errors: data,
      };
    }

    if (problemErrorResponseSchema.safeParse(data).success) {
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
