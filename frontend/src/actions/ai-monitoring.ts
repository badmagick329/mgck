'use server';

import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { ADMIN_ROLE } from '@/lib/consts/account';
import { setAiEnabled } from '@/lib/emojify/monitoring';
import { revalidatePath } from 'next/cache';

export async function changeAiAvailability(formData: FormData) {
  const session = await getVerifiedCoreSession();
  if (session?.role !== ADMIN_ROLE)
    throw new Error('Administrator access required');
  const enabled = formData.get('enabled');
  if (enabled !== 'true' && enabled !== 'false')
    throw new Error('Invalid AI setting');
  await setAiEnabled(enabled === 'true');
  revalidatePath('/account/home/ai-usage');
}
