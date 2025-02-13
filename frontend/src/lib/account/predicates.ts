import {
  ApiError,
  CredentialsErrorResponse,
  ErrorResponse,
  MessageResponse,
  ProblemError,
  ProblemErrorResponse,
  RoleResponse,
  SuccessBase,
  SuccessResponse,
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

const isProblemErrors = (x: any): x is ProblemError[] => {
  return Array.isArray(x) && x.every(isProblemError);
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

const isSuccessBase = (x: any): x is SuccessBase => {
  return (
    typeof x === 'object' &&
    x !== null &&
    x.type === 'success' &&
    typeof x.status === 'number'
  );
};

const isRoleResponse = (x: any): x is RoleResponse => {
  return isSuccessBase(x) && x?.data && 'role' in x.data;
};

const isMessageResponse = (x: any): x is MessageResponse => {
  return isSuccessBase(x) && x?.data && 'message' in x.data;
};

const isSuccessResponse = (x: any): x is SuccessResponse => {
  return isRoleResponse(x) || isMessageResponse(x);
};

export {
  isCredentialsErrorResponse,
  isProblemErrorResponse,
  isProblemError,
  isProblemErrors,
  isApiError,
  isErrorResponse,
  isSuccessResponse,
  isRoleResponse,
  isMessageResponse,
};
