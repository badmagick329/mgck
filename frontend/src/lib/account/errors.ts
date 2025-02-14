import {
  ApiError,
  CredentialsErrorResponse,
  credentialsErrorResponseSchema,
  ErrorResponse,
  problemErrorResponseSchema,
} from '@/lib/types/auth';

const stringifyErrors = (e: ApiError): string[] => {
  const problemErrorResponseParse = problemErrorResponseSchema.safeParse(e);
  if (problemErrorResponseParse.success) {
    return problemErrorResponseParse.data.errors.flatMap((error) => {
      return Object.entries(error).map(([field, messages]) => {
        return `${field}: ${messages.join(', ')}`;
      });
    });
  }

  const credentialsErrorResponseParse =
    credentialsErrorResponseSchema.safeParse(e);
  if (credentialsErrorResponseParse.success) {
    return stringifyCredentialsErrorWithoutCode(
      credentialsErrorResponseParse.data
    );
  }
  return ['Unknown server error'];
};

const stringifyCredentialsError = (e: CredentialsErrorResponse): string[] => {
  return e.map((error) => `${error.code}: ${error.description}`);
};

const stringifyCredentialsErrorWithoutCode = (
  e: CredentialsErrorResponse
): string[] => {
  return e.map((error) => error.description);
};

const createErrorResponse = (response?: Response): ErrorResponse => {
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
};

export { stringifyErrors, createErrorResponse };
