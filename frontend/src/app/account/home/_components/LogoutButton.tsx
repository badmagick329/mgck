'use client';
import { logoutUserAction } from '@/actions/account';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  return (
    <Button
      onClick={async () => {
        await logoutUserAction();
      }}
      variant={'destructive'}
    >
      Logout
    </Button>
  );
}
