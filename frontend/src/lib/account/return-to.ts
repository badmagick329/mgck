import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';

export function getSafeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return ACCOUNT_USER_HOME;
  }
  const path = value.split('?')[0];
  if (path === '/account' || path.startsWith('/account/')) {
    return ACCOUNT_USER_HOME;
  }
  return value;
}
