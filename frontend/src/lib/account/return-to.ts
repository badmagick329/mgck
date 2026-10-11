import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';

// Placeholder origin: a candidate that resolves to any other origin escapes the site.
const SITE = 'https://site.invalid';

/**
 * returnTo is attacker-controlled and ends in a redirect, so it must stay on this
 * site and outside /account (which would loop back to login). Validation uses the
 * browser's own URL parsing because browsers treat `\` as `/` and drop tabs and
 * newlines, which turns strings like `/\evil.com` into protocol-relative URLs.
 * The normalised path is returned so the redirect is exactly what was checked.
 */
export function getSafeReturnTo(value: string | null | undefined): string {
  if (!value?.startsWith('/')) {
    return ACCOUNT_USER_HOME;
  }
  let url: URL;
  try {
    url = new URL(value, SITE);
  } catch {
    return ACCOUNT_USER_HOME;
  }
  const { origin, pathname, search, hash } = url;
  // Dot segments can normalise to `//host` (e.g. `/.//evil.com`) while still same-origin.
  if (origin !== SITE || pathname.startsWith('//')) {
    return ACCOUNT_USER_HOME;
  }
  if (pathname === '/account' || pathname.startsWith('/account/')) {
    return ACCOUNT_USER_HOME;
  }
  return `${pathname}${search}${hash}`;
}
