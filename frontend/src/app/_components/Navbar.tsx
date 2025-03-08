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
        <Link
          className={`${isHome ? 'cursor-default' : 'cursor-pointer'}`}
          href='/'
        >
          <Button
            className='text-xl'
            size='icon'
            variant='outline'
            disabled={isHome}
          >
            <IoHome />
          </Button>
        </Link>
        <Link
          className={`${isUserHome ? 'cursor-default' : 'cursor-pointer'}`}
          href='/account'
        >
          <Button
            className='text-xl'
            size='icon'
            variant='outline'
            disabled={isUserHome}
          >
            <FaUser />
          </Button>
        </Link>
      </div>
      <ThemeToggler />
    </div>
  );
}
