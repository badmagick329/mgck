import Link from 'next/link';
import DiscordSvg from '@/components/icons/DiscordSvg';
import GithubSvg from '@/components/icons/GithubSvg';
import FeedbackForm from './FeedbackForm';

const DISCORD_USER = process.env.NEXT_PUBLIC_DISCORD_USER;

export default function Footer() {
  return (
    <footer className='flex w-full justify-between gap-2 px-4 py-2'>
      <section className='flex items-center gap-2'>
        <DiscordContact />
        <GithubContact />
      </section>
      <section className='flex items-center gap-2'>
        <FeedbackForm />
      </section>
    </footer>
  );
}

function DiscordContact() {
  if (DISCORD_USER) {
    return (
      <Link href={DISCORD_USER} target='_blank'>
        <div className='flex items-center gap-1 p-1 text-foreground/80 hover:scale-110 hover:text-blue-600'>
          <DiscordSvg title='Discord' className='h-6 w-6' />
          <span className='text-sm'>badmagick</span>
        </div>
      </Link>
    );
  }
  return (
    <div className='flex items-center gap-1 p-1 text-foreground/80'>
      <DiscordSvg title='Discord' className='h-6 w-6' />
      <span className='text-sm'>badmagick</span>
    </div>
  );
}

function GithubContact() {
  return (
    <Link href='https://github.com/badmagick329' target='_blank'>
      <div className='flex items-center gap-1 p-1 text-foreground/80 hover:scale-110 hover:text-blue-600'>
        <GithubSvg title='Github' className='h-6 w-6 p-1' />
        <span className='text-sm'>badmagick329</span>
      </div>
    </Link>
  );
}
