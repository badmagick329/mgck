import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import HamsterImage from '../../public/images/hamster.png';

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
      <Link href='/'>
        <Button className='text-xl underline' variant='link' size='lg'>
          Return Home
        </Button>
      </Link>
    </div>
  );
}
