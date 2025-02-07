export type CredentialsErrorResponse = {
  code: string;
  description: string;
}[];

export type ProblemErrorResponse = {
  errors: {
    [field: string]: string[];
  }[];
};

export type ProblemError = {
  [field: string]: string[];
};

export type ApiError = CredentialsErrorResponse | ProblemError[];

export type ErrorResponse = {
  type: 'error';
  status: number;
  errors: ApiError;
};

export type ServerResponse =
  | {
      type: 'success';
      status: number;
      message: string;
    }
  | ErrorResponse;
