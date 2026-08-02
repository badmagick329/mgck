import { redirect } from 'next/navigation';
import { ACCOUNT_LOGIN, ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { getSafeReturnTo } from '@/lib/account/return-to';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getVerifiedCoreSession();
  if (!session) {
    const returnTo = getSafeReturnTo((await searchParams).returnTo);
    redirect(`${ACCOUNT_LOGIN}?returnTo=${encodeURIComponent(returnTo)}`);
  }
  redirect(ACCOUNT_USER_HOME);
}
