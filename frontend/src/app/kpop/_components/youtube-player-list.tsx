import YoutubePlayer from './youtube-player';

export default function YoutubePlayerList({ urls }: { urls: string[] }) {
  const videoIds = urls.map((url) => url.split('v=')[1]).filter(Boolean);
  return (
    <div className='flex flex-col'>
      {videoIds.map((videoId) => (
        <YoutubePlayer key={videoId} videoId={videoId} />
      ))}
    </div>
  );
}
