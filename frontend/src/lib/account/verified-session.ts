import { verifyCoreAccessToken } from '@/lib/account/core-token';
import { API_USER_ROLE } from '@/lib/consts/urls';
import { cookies } from 'next/headers';
import 'server-only';
import { z } from 'zod';

const currentRoleSchema = z.object({ role: z.string().trim().min(1).max(255) });

export async function getVerifiedCoreSession() {
  const token = (await cookies()).get('token')?.value;
  const result = await verifyCoreAccessToken(token);
  return result.ok ? result.session : null;
}

/**
 * The verified session with its role replaced by Core's current one. An access
 * token keeps the role it was issued with until it expires (an hour in
 * production), so every call that grants access in Django uses this, while page
 * rendering may use the token role. Fails closed: a deleted or role-less user,
 * or an unreachable Core, yields null.
 */
export async function getCurrentCoreSession() {
  const session = await getVerifiedCoreSession();
  if (!session) return null;
  try {
    const response = await fetch(
      `${process.env.CORE_API_BASE_URL}${API_USER_ROLE}`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) return null;
    const parsed = currentRoleSchema.safeParse(await response.json());
    return parsed.success ? { ...session, role: parsed.data.role } : null;
  } catch {
    return null;
  }
}
