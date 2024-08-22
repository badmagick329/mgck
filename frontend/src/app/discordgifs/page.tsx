'use client';

import FileDropzone from './_components/file-dropzone';

export default function DiscordGifsPage() {
  return (
    <main className='flex min-h-screen w-full flex-col bg-background-dg px-4 pt-6 text-white'>
      <div className='flex flex-col items-center px-4 py-6'>
        <h1 className='rounded-md border-2 border-primary-dg bg-secondary-dg px-4 py-2 text-xl shadow-glow-primary-dg'>
          Create discord emotes and stickers from video clips
        </h1>
        <div className='grid grid-cols-1 gap-2 py-8'>
          <p className='text-center text-lg'>📝 Tips</p>
          <div className='text-sm'>
            <p>
              🎬 Video for an emote should ideally be{' '}
              <span className='font-semibold'>7 seconds or less</span>
            </p>
            <p>
              🫣 Video for a sticker <span className='font-bold'>has</span> to
              be <span className='font-semibold'>7 seconds or less</span>
            </p>
            <p>
              🎞️ Video should be{' '}
              <span className='font-semibold'>under 50 FPS</span>
            </p>
          </div>
        </div>
      </div>
      <FileDropzone />
    </main>
  );
}
