import {
  ApiError,
  CredentialsErrorResponse,
  ErrorResponse,
  ProblemError,
  ProblemErrorResponse,
  ServerResponse,
} from '@/lib/types/auth';

const isCredentialsErrorResponse = (x: any): x is CredentialsErrorResponse => {
  return (
    Array.isArray(x) &&
    x.every(
      (item) =>
        typeof item.code === 'string' && typeof item.description === 'string'
    )
  );
};

const isProblemErrorResponse = (x: any): x is ProblemErrorResponse => {
  return (
    typeof x === 'object' &&
    x !== null &&
    Array.isArray(x.errors) &&
    x.errors.every((error: any) => {
      return (
        typeof error === 'object' &&
        error !== null &&
        Object.keys(error).every(
          (field) =>
            Array.isArray(error[field]) &&
            error[field].every((item) => typeof item === 'string')
        )
      );
    })
  );
};

const isProblemError = (x: any): x is ProblemError => {
  return (
    typeof x === 'object' &&
    x !== null &&
    Object.keys(x).every(
      (field) =>
        Array.isArray(x[field]) &&
        x[field].every((item) => typeof item === 'string')
    )
  );
};

const isApiError = (x: any): x is ApiError => {
  return (
    isCredentialsErrorResponse(x) ||
    (Array.isArray(x) && x.every(isProblemError))
  );
};

const isErrorResponse = (x: any): x is ErrorResponse => {
  return (
    typeof x === 'object' &&
    x !== null &&
    x.type === 'error' &&
    typeof x.status === 'number' &&
    isApiError(x.errors)
  );
};

const isSuccessResponse = (
  x: any
): x is { type: 'success'; status: number; message: string } => {
  return (
    typeof x === 'object' &&
    x !== null &&
    x.type === 'success' &&
    typeof x.status === 'number' &&
    typeof x.message === 'string'
  );
};

const isServerResponse = (x: any): x is ServerResponse => {
  return isSuccessResponse(x) || isErrorResponse(x);
};

export {
  isCredentialsErrorResponse,
  isProblemErrorResponse,
  isProblemError,
  isApiError,
  isErrorResponse,
  isSuccessResponse,
};
