import { Separator } from '@/components/ui/separator';

import YoutubePlayerCarousel from './youtube-player-carousel';

type ComebackProps = {
  title: string;
  artist: string;
  album: string;
  releaseType: string;
  releaseDate: string;
  urls: string[];
};

export default function ComebackCard({
  title,
  artist,
  album,
  releaseType,
  releaseDate,
  urls,
}: ComebackProps) {
  return (
    <div className='bg-background-light flex flex-col items-center gap-4 rounded-md border-2 p-4'>
      <div className='flex w-full flex-col items-center gap-6'>
        <div className='flex w-full flex-col items-center gap-4'>
          <span className='flex justify-end text-sm font-bold text-gray-600 dark:text-gray-400'>
            {releaseDate}
          </span>
          <div className='w-full bg-gray-600 py-[1px] dark:bg-gray-400'></div>
          <span className='text-bold text-2xl'>{artist}</span>
          <span className='text-lg italic'>{title}</span>
        </div>
        <div className='w-full bg-gray-600 py-[1px] dark:bg-gray-400'></div>
        <div className='flex w-full justify-between'>
          <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
            {album}
          </span>
          <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
            {releaseType}
          </span>
        </div>
        <YoutubePlayerCarousel urls={urls} />
      </div>
    </div>
  );
}
