'use client';

import { Button } from '@/components/ui/button';
import { DISCORD_GIFS } from '@/lib/consts/urls';
import Link from 'next/link';

export default function DiscordGifsIntro() {
  return (
    <div className='grid place-content-center place-items-center gap-8 border-t-2 border-primary-dg bg-background-dg px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Use your video clips to make discord emotes and stickers that fit the
        discord size limits.
      </span>
      <Link href={DISCORD_GIFS}>
        <Button className='w-72 border-primary-dg bg-primary-dg/70 font-semibold text-primary-foreground shadow-glow-primary-dg hover:bg-primary-dg md:w-96 md:text-lg'>
          Emotes and stickers
        </Button>
      </Link>
    </div>
  );
}
