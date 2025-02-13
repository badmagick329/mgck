import {
  isCredentialsErrorResponse,
  isProblemErrors,
} from '@/lib/account/predicates';
import {
  ApiError,
  CredentialsErrorResponse,
  ErrorResponse,
} from '@/lib/types/auth';

const stringifyErrors = (e: ApiError): string[] => {
  if (isProblemErrors(e)) {
    return e.flatMap((error) => {
      return Object.entries(error).map(([field, messages]) => {
        return `${field}: ${messages.join(', ')}`;
      });
    });
  } else if (isCredentialsErrorResponse(e)) {
    return stringifyCredentialsErrorWithoutCode(e);
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
