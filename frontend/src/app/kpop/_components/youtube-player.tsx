export default function YoutubePlayer({ videoId }: { videoId: string }) {
  const cleanId = videoId.split('?')[0].split('&')[0];
  return (
    <iframe
      src={`https://www.youtube.com/embed/${cleanId}`}
      className='rounded-md border-0'
      allow='autoplay; encrypted-media'
      allowFullScreen
      title='video'
      width={280}
    />
  );
}
