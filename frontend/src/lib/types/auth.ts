type ServerResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type TokenResponse = {
  token: string;
  refreshToken: string;
};

type LoginResponse = ServerResponse & {
  data?: TokenResponse;
};
