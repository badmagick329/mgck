import { Button } from '@/components/ui/button';
import { DISCORD_GIFS } from '@/lib/consts/urls';
import Link from 'next/link';

export default function DiscordGifsIntro() {
  return (
    <div className='flex flex-col items-center gap-8 border-2 border-white px-6 py-2'>
      <span className='text-lg'>
        Use your video clips to make discord emotes and stickers that fit the
        size limits.
      </span>
      <Link href={DISCORD_GIFS}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          Discord emotes and stickers
        </Button>
      </Link>
    </div>
  );
}
