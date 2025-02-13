import {
  isCredentialsErrorResponse,
  isProblemErrors,
} from '@/lib/account/predicates';
import { ApiError, CredentialsErrorResponse } from '@/lib/types/auth';

const stringifyErrors = (e: ApiError): string[] => {
  if (isProblemErrors(e)) {
    console.log('is problem errors');
    return e.flatMap((error) => {
      return Object.entries(error).map(([field, messages]) => {
        return `${field}: ${messages.join(', ')}`;
      });
    });
  } else if (isCredentialsErrorResponse(e)) {
    console.log('is credentials errors');
    return stringifyCredentialsErrorWithoutCode(e);
  }
  console.log('is unknown errors');
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

export { stringifyErrors };
