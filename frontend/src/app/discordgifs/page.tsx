'use client';

import FileDropzone from './_components/file-dropzone';

export default function DiscordGifsPage() {
  return (
    <main className='bg-backgroundDg flex min-h-screen w-full flex-col pt-6'>
      <FileDropzone />
    </main>
  );
}
