export default function YoutubePlayer({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      className='rounded-md border-0'
      allow='autoplay; encrypted-media'
      allowFullScreen
      title='video'
      width={280}
    />
  );
}
