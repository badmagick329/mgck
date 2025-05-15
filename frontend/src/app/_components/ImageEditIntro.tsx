'use client';

import { Button } from '@/components/ui/button';
import { IMAGE_EDIT } from '@/lib/consts/urls';
import Link from 'next/link';

export default function ImageEditIntro() {
  return (
    <div className='grid place-content-center place-items-center gap-8 border-t-2 border-primary-dg bg-background-dg px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Auto crop solid color or gradient around images
      </span>
      <Link href={IMAGE_EDIT}>
        <Button className='w-72 border-primary-dg bg-primary-dg/70 font-semibold text-primary-foreground shadow-glow-primary-dg hover:bg-primary-dg md:w-96 md:text-lg'>
          Image cropper
        </Button>
      </Link>
    </div>
  );
}
