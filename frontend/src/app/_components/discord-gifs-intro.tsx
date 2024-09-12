import { Button } from '@/components/ui/button';
import { DISCORD_GIFS } from '@/lib/consts/urls';
import Link from 'next/link';

export default function DiscordGifsIntro() {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <span className='text-lg'>
        Use your video clips to make discord emotes and stickers that fit the
        size limits.
      </span>
      <Link href={DISCORD_GIFS}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          Create discord emotes and stickers
        </Button>
      </Link>
    </div>
  );
}
