import { ThemeToggler } from '@/components/theme-toggler';
import { Button } from '@/components/ui/button';
import {
  DISCORD_GIFS,
  EMOJIFY_BASE,
  GFYS_BASE,
  KPOP_BASE,
} from '@/lib/consts/urls';
import Link from 'next/link';

const pageLinks = [
  [GFYS_BASE, 'Red Velvet Gfys'],
  [KPOP_BASE, 'Kpop Comebacks'],
  [EMOJIFY_BASE, 'Emojify your message 😀'],
  [DISCORD_GIFS, 'Create discord emotes and stickers'],
];

export default function Index() {
  return (
    <main className='flex min-h-screen flex-col'>
      <div className='flex w-full justify-end px-2 pt-2'>
        <ThemeToggler />
      </div>
      <div className='flex flex-col items-center justify-center space-y-4 pt-12'>
        {pageLinks.map((entry) => {
          const [url, message] = entry;
          return (
            <Link href={url}>
              <Button className='w-72 font-semibold md:w-96 md:text-lg'>
                {message}
              </Button>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
