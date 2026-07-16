'use client';

import ComebackCardAlbum from './ComebackCardAlbum';
import ComebackCardYoutube from './ComebackCardYoutube';
import { dayOffsetFromToday, relativeDayLabel } from '@/lib/kpop';

import FollowArtistButton from './FollowArtistButton';

type ComebackProps = {
  title: string;
  artist: string;
  artistPublicId: string;
  album: string;
  releaseType: string;
  releaseDate: string;
  urls: string[];
};

export default function ComebackCard({
  title,
  artist,
  artistPublicId,
  album,
  releaseType,
  releaseDate,
  urls,
}: ComebackProps) {
  const videoIds = urls
    .map((url) => {
      if (url.includes('v=')) {
        return url.split('v=')[1];
      } else if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
      }
      return '';
    })
    .filter(Boolean);

  return (
    <div className='flex max-w-[400px] flex-col items-center gap-4 rounded-md border-2 bg-primary-kp/30 p-4'>
      <div className='flex h-full w-full flex-col items-center justify-between gap-6'>
        <div className='flex w-full flex-col gap-2'>
          <div className='flex w-full flex-col items-center gap-4'>
            <ComebackCardDate releaseDate={releaseDate} />
            <ComebackCardDivider />
            <div className='flex w-full items-center justify-center gap-1'>
              <ComebackCardArtist artist={artist} />
              <FollowArtistButton publicId={artistPublicId} displayName={artist} />
            </div>
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
  const dayOffset = dayOffsetFromToday(releaseDate);
  const dateStyling = getDateStripStyling(dayOffset);
  const labelStyling = getRelativeChipStyling(dayOffset);
  const relativeLabel = relativeDayLabel(dayOffset);
  return (
    <div className='flex flex-col items-center gap-1'>
      <span className={`flex justify-end text-sm font-bold ${dateStyling}`}>
        {releaseDate}
      </span>
      <span className={`text-xs ${labelStyling}`}>{relativeLabel}</span>
    </div>
  );
}

function getDateStripStyling(dayOffset: number) {
  if (dayOffset === 0) {
    return 'rounded-sm bg-green-500 px-2 py-1 text-slate-950';
  }
  return 'text-gray-600 dark:text-gray-400';
}

function getRelativeChipStyling(dayOffset: number) {
  if (dayOffset === 0) {
    return 'rounded-sm border border-green-400/70 bg-green-500/25 px-2 py-0.5 font-bold text-green-200';
  }
  if (Math.abs(dayOffset) <= 7) {
    return 'rounded-sm border border-foreground/25 bg-foreground/14 px-2 py-0.5 font-semibold text-foreground';
  }
  return 'rounded-sm border border-foreground/12 bg-foreground/8 px-2 py-0.5 font-medium text-foreground/80';
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
