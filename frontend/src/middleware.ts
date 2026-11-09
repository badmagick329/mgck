import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_REFRESH, KPOP_BASE } from '@/lib/consts/urls';
import {
  isCoreSessionExpiring,
  verifyCoreAccessToken,
} from '@/lib/account/core-token';
import { accessCookieOptions } from '@/lib/account/auth-cookies';
import { getKpopRedirectUrl } from '@/lib/kpop/query';

const BASE_URL = process.env.CORE_API_BASE_URL;

async function refreshTokens(refreshToken: string): Promise<{
  token: string;
  expiresAt: number;
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
    return verified.ok && data.refreshToken === refreshToken
      ? { token: data.token, expiresAt: verified.session.expiresAt }
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
  const kpopRedirect = getKpopCanonicalRedirect(request);
  if (kpopRedirect) {
    return kpopRedirect;
  }

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
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      response.cookies.set(
        'token',
        newTokens.token,
        accessCookieOptions(newTokens.expiresAt)
      );
      return response;
    }

    return clearAuthentication(request, protectedRoute);
  }

  if (!verification.ok) {
    return clearAuthentication(request, protectedRoute);
  }

  return NextResponse.next();
}

/**
 * Redirecting from the page came after kpop/loading.tsx had flushed, so the
 * response was a 200 with a meta refresh. 307 rather than 308: the canonical
 * form depends on today's date (the default start date is omitted). Auth work
 * is skipped; the follow-up request to the canonical URL does it.
 */
function getKpopCanonicalRedirect(request: NextRequest) {
  if (request.nextUrl.pathname !== KPOP_BASE) {
    return null;
  }
  const canonicalUrl = getKpopRedirectUrl(request.nextUrl.searchParams);
  return canonicalUrl
    ? NextResponse.redirect(new URL(canonicalUrl, request.url), 307)
    : null;
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

export const config = {
  // ffmpeg: the static ~32 MB FFmpeg core needs no auth; matching it would put
  // clearAuthentication's Set-Cookie on an immutable cached asset.
  matcher: ['/((?!api|healthz|ffmpeg/|_next/static|_next/image|favicon.ico).*)'],
};
