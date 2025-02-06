type ApiError = {
  code: string;
  description: string;
};

type TokenResponse = {
  token: string;
  refreshToken: string;
};

type ErrorResponse = {
  type: 'error';
  errors: ApiError[];
};

type ServerResponse =
  | {
      type: 'success';
      message?: string;
    }
  | ErrorResponse;

type LoginResponse =
  | {
      type: 'success';
      data: TokenResponse;
    }
  | ErrorResponse;
