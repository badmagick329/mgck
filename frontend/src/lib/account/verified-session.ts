import { verifyCoreAccessToken } from '@/lib/account/core-token';
import { cookies } from 'next/headers';
import 'server-only';

export async function getVerifiedCoreSession() {
  const token = (await cookies()).get('token')?.value;
  const result = await verifyCoreAccessToken(token);
  return result.ok ? result.session : null;
}
