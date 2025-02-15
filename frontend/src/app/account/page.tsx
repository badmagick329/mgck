import { redirect } from 'next/navigation';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';

export default async function AccountPage() {
  redirect(ACCOUNT_USER_HOME);
}
