import Link from 'next/link';
import DiscordSvg from '@/components/icons/DiscordSvg';
import GithubSvg from '@/components/icons/GithubSvg';
import { MessageSquare } from 'lucide-react';

export default function Navbar() {
  return (
    <footer className='flex w-full justify-between gap-2 px-4 py-2'>
      <section className='flex items-center gap-2'>
        <span className='text-xl font-semibold text-foreground/80'>
          Contact
        </span>
        <Link
          href='https://discord.com/users/221379755830804480'
          target='_blank'
        >
          <DiscordSvg
            title='Contact me on discord'
            className='h-8 w-8 text-foreground/80 hover:text-blue-800'
          />
        </Link>
        <Link href='https://github.com/badmagick329' target='_blank'>
          <GithubSvg
            title='Contact me on github'
            className='h-8 w-8 p-1 text-foreground/80 hover:text-blue-800'
          />
        </Link>
      </section>
      <section className='flex items-center gap-2'>
        <MessageSquare className='text-foreground/80' />
      </section>
    </footer>
  );
}
