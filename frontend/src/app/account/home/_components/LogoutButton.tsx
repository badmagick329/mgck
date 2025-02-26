'use client';
import { logoutUserAction } from '@/actions/account';
import { Button } from '@/components/ui/button';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      onClick={async () => {
        await logoutUserAction();
        router.push(ACCOUNT_USER_HOME);
      }}
      variant={'destructive'}
    >
      Logout
    </Button>
  );
}
