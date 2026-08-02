import { cookies } from 'next/headers';
import 'server-only';

const BASE_URL = process.env.BASE_URL;
const DJANGO_SESSION_COOKIE = 'sessionid';

export async function hasFilesAccess() {
  const sessionId = (await cookies()).get(DJANGO_SESSION_COOKIE)?.value;
  if (!sessionId || !BASE_URL) return false;

  try {
    const response = await fetch(`${BASE_URL}/files/session-status/`, {
      cache: 'no-store',
      headers: { Cookie: `${DJANGO_SESSION_COOKIE}=${sessionId}` },
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { has_access?: unknown };
    return data.has_access === true;
  } catch {
    return false;
  }
}
