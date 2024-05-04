'use client';

import { Button } from '@/components/ui/button';
import { KPOP_BASE } from '@/lib/consts/urls';
import Image from 'next/image';
import Link from 'next/link';

import HamsterImage from '../../../public/images/hamster.png';

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center gap-4 pt-24'>
      <span className='text-xl'>Page not found</span>
      <Image
        className='h-auto w-[80px]'
        src={HamsterImage}
        alt='hamster'
        width={120}
        height={130}
      />
      <Button
        className='text-xl underline'
        variant='link'
        size='lg'
        onClick={() => (window.location.href = KPOP_BASE)}
      >
        Go back
      </Button>
    </div>
  );
}
