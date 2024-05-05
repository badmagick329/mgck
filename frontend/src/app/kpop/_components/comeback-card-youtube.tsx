import YoutubeLinks from './youtube-links';
import YoutubeSearchLink from './youtube-search-link';

const DAY = 1000 * 60 * 60 * 24;

export default function ComebackCardYoutube({
  videoIds,
  title,
  artist,
  releaseDate,
}: {
  videoIds: string[];
  title: string;
  artist: string;
  releaseDate: string;
}) {
  const today = new Date();
  const release = new Date(releaseDate);
  const diff = Math.floor((release.getTime() - today.getTime()) / DAY);
  if (diff > 5) {
    return <div className='h-6 w-full' />;
  }
  return (
    <>
      {videoIds.length > 0 ? (
        <YoutubeLinks videoIds={videoIds} />
      ) : (
        <YoutubeSearchLink artist={artist} title={title} />
      )}
    </>
  );
}
