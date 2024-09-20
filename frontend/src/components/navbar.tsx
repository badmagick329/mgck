'use client';

import { ThemeToggler } from '@/components/theme-toggler';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome } from 'react-icons/io5';

import { Button } from './ui/button';

export default function Navbar() {
  const path = usePathname();
  const isHome = path === '/';
  return (
    <div className='flex w-full justify-between p-2'>
      <Link href='/'>
        <Button
          className='text-xl'
          size='icon'
          variant='outline'
          disabled={isHome}
        >
          <IoHome />
        </Button>
      </Link>
      <ThemeToggler />
    </div>
  );
}
