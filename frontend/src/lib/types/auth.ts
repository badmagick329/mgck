export type CredentialsErrorResponse = {
  code: string;
  description: string;
}[];

export type ProblemError = {
  [field: string]: string[];
};

export type ProblemErrorResponse = {
  errors: ProblemError[];
};

export type ApiError = CredentialsErrorResponse | ProblemError[];

export type ErrorResponse = {
  type: 'error';
  status: number;
  errors: ApiError;
};

export type SuccessBase = {
  type: 'success';
  status: number;
  data?: any;
};

export type UserRoles = 'Admin' | 'NewUser' | 'AcceptedUser';

export type RoleResponse = SuccessBase & {
  data: { role: UserRoles };
};

export type MessageResponse = SuccessBase & {
  data: { message: string };
};

export type SuccessResponse = MessageResponse | RoleResponse;

export type AspAuthResponse = SuccessResponse | ErrorResponse;
