'use client';
import { logoutUserAction } from '@/actions/account';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  return (
    <Button
      onClick={async () => {
        const result = await logoutUserAction();
        console.log('logout result');
        console.log(result);
      }}
      variant={'destructive'}
    >
      Logout
    </Button>
  );
}
