import YoutubeLinks from './youtube-links';
import YoutubeSearchLink from './youtube-search-link';

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
    <div className='flex max-w-[400px] flex-col items-center gap-4 rounded-md border-2 bg-background-light p-4'>
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
        {videoIds.length > 0 ? (
          <YoutubeLinks videoIds={videoIds} />
        ) : (
          <YoutubeSearchLink artist={artist} title={title} />
        )}
      </div>
    </div>
  );
}
