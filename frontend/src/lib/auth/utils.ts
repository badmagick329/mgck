import {
  isCredentialsErrorResponse,
  isProblemError,
} from '@/lib/auth/predicates';
import { ApiError } from '@/lib/types/auth';

const stringifyErrors = (e: ApiError): string => {
  if (isProblemError(e)) {
    return e
      .map((error) => {
        return Object.entries(error)
          .map(([field, messages]) => {
            return `${field}: ${messages.join(', ')}`;
          })
          .join('\n');
      })
      .join('\n\n');
  } else if (isCredentialsErrorResponse(e)) {
    return e.map((error) => `${error.code}: ${error.description}`).join('\n');
  }
  return 'Unknown server error';
};

export { stringifyErrors };
