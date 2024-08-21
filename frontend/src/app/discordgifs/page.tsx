'use client';

import FileDropzone from './_components/file-dropzone';

export default function DiscordGifsPage() {
  return (
    <main className='bg-background-dg flex min-h-screen w-full flex-col pt-6'>
      <div className='flex flex-col items-center px-4 pb-6'>
        <h1 className='bg-secondary-dg shadow-glow-primary-dg border-primary-dg rounded-md border-2 px-4 py-2 text-xl'>
          Create discord emotes and stickers from video clips
        </h1>
        <div className='grid grid-cols-1 gap-2 py-6'>
          <p>Tips 📝</p>
          <div className='text-sm'>
            <p>🎬 Videos should ideally by 7 seconds or shorter</p>
            <p>🎞️ Videos should be 50fps or less</p>
            <p>🫣 Discord stickers cannot be longer than 7 seconds</p>
          </div>
        </div>
      </div>
      <FileDropzone />
    </main>
  );
}
