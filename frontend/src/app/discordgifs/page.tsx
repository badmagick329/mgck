'use client';

import Navbar from '@/app/_components/Navbar';

import FileDropzone from './_components/FileDropzone';
import Footer from '@/app/_components/Footer';

export default function DiscordGifsPage() {
  return (
    <main className='flex min-h-dvh w-full flex-col bg-background-dg'>
      <Navbar />
      <div className='flex flex-col items-center gap-2 px-4 pb-5 pt-4 text-center'>
        <h1 className='max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl'>
          Make Discord emojis, stickers, and avatars
        </h1>
        <p className='max-w-2xl text-base text-foreground-dg/80 sm:text-lg'>
          Drop in a clip and we&apos;ll squeeze it under Discord&apos;s size
          limits.
        </p>
      </div>
      <FileDropzone />
      <Footer />
    </main>
  );
}
