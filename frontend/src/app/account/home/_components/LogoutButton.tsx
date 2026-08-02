'use client';
import { logoutUserAction } from '@/actions/account';
import { Button, ButtonProps } from '@/components/ui/button';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';
import { useRouter } from 'next/navigation';
import { ImExit } from 'react-icons/im';
import { TbDoorExit } from 'react-icons/tb';

export default function LogoutButton({
  className,
  variant = 'destructive',
}: Pick<ButtonProps, 'className' | 'variant'>) {
  const router = useRouter();
  return (
    <Button
      onClick={async () => {
        await logoutUserAction();
        router.push(ACCOUNT_USER_HOME);
      }}
      className={className}
      variant={variant}
    >
      <span className='flex items-center gap-2'>
        <ImExit />
        Logout
      </span>
    </Button>
  );
}
