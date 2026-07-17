import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_REFRESH } from '@/lib/consts/urls';
import {
  isCoreSessionExpiring,
  verifyCoreAccessToken,
} from '@/lib/account/core-token';

const BASE_URL = process.env.CORE_API_BASE_URL;
const IS_PROD = process.env.NODE_ENV === 'production';

async function refreshTokens(refreshToken: string): Promise<{
  token: string;
  refreshToken: string;
} | null> {
  try {
    const response = await fetch(`${BASE_URL}${API_REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (
      typeof data.token !== 'string' ||
      typeof data.refreshToken !== 'string'
    ) {
      return null;
    }
    const verified = await verifyCoreAccessToken(data.token);
    return verified.ok
      ? { token: data.token, refreshToken: data.refreshToken }
      : null;
  } catch {
    return null;
  }
}

function isProtectedRoute(pathname: string) {
  if (pathname.startsWith('/account')) {
    return !pathname.startsWith('/account/login');
  }

  return pathname === '/authtest';
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const currentRefreshToken = request.cookies.get('refreshToken')?.value;
  const verification = await verifyCoreAccessToken(token);
  const pathname = request.nextUrl.pathname;
  const protectedRoute = isProtectedRoute(pathname);

  if (
    currentRefreshToken &&
    (!verification.ok || isCoreSessionExpiring(verification.session))
  ) {
    const newTokens = await refreshTokens(currentRefreshToken);
    if (newTokens !== null) {
      request.cookies.set('token', newTokens.token);
      request.cookies.set('refreshToken', newTokens.refreshToken);
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      setAuthenticationCookies(response, newTokens);
      return response;
    }

    return clearAuthentication(request, protectedRoute);
  }

  if (!verification.ok) {
    return clearAuthentication(request, protectedRoute);
  }

  return NextResponse.next();
}

function clearAuthentication(request: NextRequest, protectedRoute: boolean) {
  request.cookies.delete('token');
  request.cookies.delete('refreshToken');
  const response = protectedRoute
    ? NextResponse.redirect(new URL('/account/login', request.url))
    : NextResponse.next({ request: { headers: request.headers } });
  response.cookies.delete('token');
  response.cookies.delete('refreshToken');
  return response;
}

function setAuthenticationCookies(
  response: NextResponse,
  tokens: { token: string; refreshToken: string }
) {
  response.cookies.set('token', tokens.token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    secure: IS_PROD,
    sameSite: 'lax',
  });
  response.cookies.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: IS_PROD,
    sameSite: 'lax',
  });
}

export const config = {
  matcher: ['/((?!api|healthz|_next/static|_next/image|favicon.ico).*)'],
};
