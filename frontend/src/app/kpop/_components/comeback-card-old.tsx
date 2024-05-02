import YoutubePlayerCarousel from './youtube-player-carousel';

type ComebackProps = {
  title: string;
  artist: string;
  album: string;
  releaseType: string;
  relesaseDate: string;
  urls: string[];
};

export default function ComebackCardOld({
  title,
  artist,
  album,
  releaseType,
  relesaseDate,
  urls,
}: ComebackProps) {
  return (
    <div className='flex flex-col items-center gap-4 p-4'>
      <div className='flex w-full flex-col items-center'>
        <div className='flex w-full justify-between'>
          <span className='text-bold px-2 text-2xl'>{artist}</span>
          <span className='keep-all text-xs'>{relesaseDate}</span>
        </div>
        <span className='text-lg italic'>{title}</span>
        <div className='flex w-full justify-between'>
          <span>{album}</span>
          <span>{releaseType}</span>
        </div>
      </div>
      <div className='pt-12'>
        <YoutubePlayerCarousel urls={urls} />
      </div>
    </div>
  );
}
