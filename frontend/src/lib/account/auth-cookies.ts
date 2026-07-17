const IS_PROD = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const sharedAuthenticationCookieOptions = {
  httpOnly: true,
  path: '/',
  secure: IS_PROD,
  sameSite: 'lax' as const,
};

export function accessCookieOptions(expiresAt: number, now = Date.now()) {
  return {
    ...sharedAuthenticationCookieOptions,
    maxAge: Math.max(1, expiresAt - Math.floor(now / 1000)),
  };
}

export function refreshCookieOptions() {
  return {
    ...sharedAuthenticationCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  };
}
