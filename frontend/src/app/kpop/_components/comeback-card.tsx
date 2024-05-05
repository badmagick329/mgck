import { useMemo } from 'react';

import ComebackCardAlbum from './comeback-card-album';
import ComebackCardArtist from './comeback-card-artist';
import ComebackCardContainer from './comeback-card-container';
import ComebackCardDate from './comeback-card-date';
import ComebackCardDivider from './comeback-card-divider';
import ComebackCardReleaseType from './comeback-card-release-type';
import ComebackCardTitle from './comeback-card-title';
import ComebackCardYoutube from './comeback-card-youtube';

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
    <ComebackCardContainer>
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
    </ComebackCardContainer>
  );
}
