export type ApiErrorResponse = {
  ok: false;
  error: string;
};
export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
