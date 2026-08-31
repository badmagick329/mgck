import { dayOffsetFromToday } from '@/lib/kpop';
import { ExternalLink, Play } from 'lucide-react';
import Link from 'next/link';

const SEARCH_BASE = 'https://youtube.com/results?search_query=';

export default function ComebackYoutubeLinks({
  urls,
  artist,
  title,
  releaseDate,
}: {
  urls: string[];
  artist: string;
  title: string;
  releaseDate: string;
}) {
  if (dayOffsetFromToday(releaseDate) > 5) {
    return null;
  }

  const videoIds = urls.map(getYoutubeVideoId).filter(Boolean);
  if (videoIds.length === 0) {
    return (
      <Link
        className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary-kp hover:underline dark:text-blue-300'
        href={`${SEARCH_BASE}${encodeURIComponent(`${artist} ${title}`)}`}
        target='_blank'
      >
        Search YouTube
        <ExternalLink className='h-3.5 w-3.5' aria-hidden='true' />
      </Link>
    );
  }

  return (
    <div className='flex flex-wrap gap-x-3 gap-y-1.5'>
      {videoIds.map((videoId, index) => (
        <Link
          key={`${videoId}:${index}`}
          className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary-kp hover:underline dark:text-blue-300'
          href={`https://youtube.com/watch?v=${encodeURIComponent(videoId)}`}
          target='_blank'
          aria-label={
            videoIds.length === 1
              ? `Watch ${artist} ${title} on YouTube`
              : `Watch ${artist} ${title} video ${index + 1} on YouTube`
          }
        >
          <Play className='h-3.5 w-3.5' aria-hidden='true' />
          {videoIds.length === 1 ? 'Watch' : `Video ${index + 1}`}
        </Link>
      ))}
    </div>
  );
}

function getYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0];
    }
    if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com'
    ) {
      return parsed.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }
  return '';
}
