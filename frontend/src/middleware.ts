import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_REFRESH } from '@/lib/consts/urls';
import { ParsedToken } from '@/lib/account/parsed-token';

const BASE_URL = process.env.CORE_API_BASE_URL;
const IS_PROD = process.env.NODE_ENV === 'production';

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
  const parsedToken = new ParsedToken(token);

  if (parsedToken.isExpiring()) {
    if (!currentRefreshToken) {
      console.log(
        '[Middleware] No refresh token found. Redirecting to login page.'
      );
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
    console.log('[Middleware] changing response to a redirect');
    const response = NextResponse.redirect(
      new URL(request.nextUrl.pathname, request.url)
    );
    console.log('[Middleware] setting new tokens in cookies');
    response.cookies.set('token', newTokens.token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      secure: IS_PROD,
    });
    response.cookies.set('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: IS_PROD,
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
