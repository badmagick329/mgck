'use client';

import { ThemeToggler } from '@/app/_components/ThemeToggler';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome } from 'react-icons/io5';
import { FaUser } from 'react-icons/fa';

import { Button } from '@/components/ui/button';

export default function Navbar() {
  const path = usePathname();
  const isHome = path === '/';
  const isUserHome = path.startsWith('/account');

  return (
    <div className='flex w-full justify-between p-2'>
      <div className='flex gap-2'>
        {isHome ? (
          <span className='cursor-default'>
            <Button className='text-xl' size='icon' variant='outline' disabled>
              <IoHome />
            </Button>
          </span>
        ) : (
          <Link href='/'>
            <Button className='text-xl' size='icon' variant='outline'>
              <IoHome />
            </Button>
          </Link>
        )}

        {isUserHome ? (
          <span className='cursor-default'>
            <Button className='text-xl' size='icon' variant='outline' disabled>
              <FaUser />
            </Button>
          </span>
        ) : (
          <Link href='/account'>
            <Button className='text-xl' size='icon' variant='outline'>
              <FaUser />
            </Button>
          </Link>
        )}
      </div>
      <ThemeToggler />
    </div>
  );
}
