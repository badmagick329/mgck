'use client';

import { ThemeToggler } from '@/components/theme-toggler';

export default function DiscordGifsPage() {
  return (
    <main className='flex min-h-screen w-full flex-col'>
      <div className='self-end p-2'>
        <ThemeToggler />
      </div>
      <div className='flex flex-grow flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold'>Discord GIFs</h1>
        <p className='mt-2 text-lg'>
          This page is under construction. Please check back later.
        </p>
      </div>
    </main>
  );
}
