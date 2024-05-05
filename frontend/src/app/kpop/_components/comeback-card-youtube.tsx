import YoutubeLinks from './youtube-links';
import YoutubeSearchLink from './youtube-search-link';

export default function ComebackCardYoutube({
  videoIds,
  title,
  artist,
}: {
  videoIds: string[];
  title: string;
  artist: string;
}) {
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
