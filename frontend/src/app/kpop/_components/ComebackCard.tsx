import { useMemo } from 'react';

import ComebackCardAlbum from './ComebackCardAlbum';
import ComebackCardYoutube from './ComebackCardYoutube';
import { dateStringIsToday } from '@/lib/utils/kpop';

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
  const videoIds = useMemo(
    () =>
      urls
        .map((url) => {
          if (url.includes('v=')) {
            return url.split('v=')[1];
          } else if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split('?')[0];
          }
          return '';
        })
        .filter(Boolean),
    [urls]
  );

  return (
    <div className='bg-primary-kp/30 flex max-w-[400px] flex-col items-center gap-4 rounded-md border-2 p-4'>
      <div className='flex h-full w-full flex-col items-center justify-between gap-6'>
        <div className='flex w-full flex-col gap-2'>
          <div className='flex w-full flex-col items-center gap-4'>
            <ComebackCardDate releaseDate={releaseDate} />
            <ComebackCardDivider />
            <ComebackCardArtist artist={artist} />
            <ComebackCardTitle title={title} />
          </div>
        </div>
        <div className='flex w-full flex-col gap-2'>
          <ComebackCardDivider />
          <div className='flex w-full justify-between'>
            <ComebackCardAlbum album={album} />
            <ComebackCardReleaseType releaseType={releaseType} />
          </div>
          <ComebackCardYoutube
            videoIds={videoIds}
            title={title}
            artist={artist}
            releaseDate={releaseDate}
          />
        </div>
      </div>
    </div>
  );
}

function ComebackCardDate({ releaseDate }: { releaseDate: string }) {
  const dateIsToday = dateStringIsToday(releaseDate);
  const textStyling = dateIsToday
    ? 'text-gray-900 px-2 py-1 bg-green-600 rounded-md'
    : 'text-gray-600 dark:text-gray-400';
  return (
    <span className={`flex justify-end text-sm font-bold ${textStyling}`}>
      {releaseDate}
    </span>
  );
}

function ComebackCardDivider() {
  return <div className='w-full bg-gray-600 py-[1px] dark:bg-gray-400'></div>;
}

function ComebackCardArtist({ artist }: { artist: string }) {
  return <span className='text-bold text-2xl'>{artist}</span>;
}

function ComebackCardTitle({ title }: { title: string }) {
  return <span className='text-lg italic'>{title}</span>;
}

function ComebackCardReleaseType({ releaseType }: { releaseType: string }) {
  return (
    <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
      {releaseType}
    </span>
  );
}
