'use client';
import { logoutUserAction } from '@/actions/account';
import { Button } from '@/components/ui/button';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { useRouter } from 'next/navigation';
import { ImExit } from 'react-icons/im';
import { TbDoorExit } from 'react-icons/tb';

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
      <span className='flex items-center gap-2'>
        <ImExit />
        Logout
      </span>
    </Button>
  );
}
