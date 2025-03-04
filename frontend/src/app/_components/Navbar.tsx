'use client';

import { ThemeToggler } from '@/app/_components/ThemeToggler';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome } from 'react-icons/io5';

import { Button } from '@/components/ui/button';

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
