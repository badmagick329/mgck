import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { API_REFRESH } from '@/lib/consts/urls';

type JWTPayload = {
  exp: number;
};

const BASE_URL = process.env.USER_AUTH_BASE_URL;

async function tokenNeedsRefresh(token: string): Promise<boolean> {
  try {
    const payload = jwtDecode<JWTPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    const needsRefresh = payload.exp < currentTime + 10;
    console.log(`token needs refresh: ${needsRefresh}`);
    return payload.exp < currentTime + 10;
  } catch (error) {
    return true;
  }
}

async function refreshTokens(refreshToken: string): Promise<{
  token: string;
  refreshToken: string;
} | null> {
  const response = await fetch(`${BASE_URL}${API_REFRESH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  try {
    console.log('[refreshTokens] parsed response:');
    const data = await response.json();
    if (data.token && data.refreshToken) {
      return {
        token: data.token,
        refreshToken: data.refreshToken,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] current route is: ${request.url}`);
  const token = request.cookies.get('token')?.value;
  const currentRefreshToken = request.cookies.get('refreshToken')?.value;

  if (!token || (await tokenNeedsRefresh(token))) {
    if (!currentRefreshToken) {
      console.log('[Middleware] No tokens found. Redirecting to login page.');
      return NextResponse.redirect(new URL('/account/login', request.url));
    }

    const newTokens = await refreshTokens(currentRefreshToken);
    if (newTokens === null) {
      console.log(
        '[Middleware] Failed to refresh tokens. Redirecting to login page.'
      );
      return NextResponse.redirect(new URL('/account/login', request.url));
    }

    console.log(
      `[Middleware] got token ${newTokens.token.slice(
        -10
      )} refreshToken ${newTokens.refreshToken.slice(-10)}`
    );
    console.log('[Middleware] setting Authorization header');
    const response = NextResponse.next({
      request: {
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          Authorization: `Bearer ${newTokens.token}`,
        }),
      },
    });
    console.log('[Middleware] setting new tokens in cookies');
    response.cookies.set('token', newTokens.token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    console.log('[Middleware] returning response');
    return response;
  }

  console.log('[Middleware] token is valid');
  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path((?!login$).*)', '/authtest'],
};
