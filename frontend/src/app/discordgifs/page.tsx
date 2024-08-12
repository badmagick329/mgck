'use client';

import { ThemeToggler } from '@/components/theme-toggler';

import FileDropzone from './_components/file-dropzone';

export default function DiscordGifsPage() {
  return (
    <main className='flex min-h-screen w-full flex-col'>
      <div className='self-end p-2'>
        <ThemeToggler />
      </div>
      <div className='flex flex-grow flex-col items-center'>
        <FileDropzone />
      </div>
    </main>
  );
}
