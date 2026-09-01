import { dayOffsetFromToday } from '@/lib/kpop';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FiSearch } from 'react-icons/fi';
import { SiApplemusic, SiSpotify, SiYoutube } from 'react-icons/si';

const YOUTUBE_SEARCH_BASE = 'https://youtube.com/results?search_query=';
const LINK_CLASS =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary-kp/25 bg-primary-kp/5 px-2.5 py-1 text-xs font-semibold text-primary-kp transition-colors hover:border-primary-kp/50 hover:bg-primary-kp/10 dark:text-blue-300';

export default function ComebackLinks({
  youtubeUrls,
  spotifyUrls,
  appleMusicUrls,
  artist,
  title,
  releaseDate,
}: {
  youtubeUrls: string[];
  spotifyUrls: string[];
  appleMusicUrls: string[];
  artist: string;
  title: string;
  releaseDate: string;
}) {
  const youtubeVideoIds = unique(
    youtubeUrls.map(getYoutubeVideoId).filter(Boolean)
  );
  const uniqueSpotifyUrls = unique(spotifyUrls);
  const uniqueAppleMusicUrls = unique(appleMusicUrls);
  const showYoutubeSearch =
    youtubeVideoIds.length === 0 && dayOffsetFromToday(releaseDate) <= 5;
  const youtubeSearchQuery = `${artist} ${title}`.trim();

  if (
    youtubeVideoIds.length === 0 &&
    !showYoutubeSearch &&
    uniqueSpotifyUrls.length === 0 &&
    uniqueAppleMusicUrls.length === 0
  ) {
    return null;
  }

  return (
    <div className='grid w-max max-w-full grid-cols-[8rem_max-content] items-start gap-2'>
      <div className='col-start-1 row-start-1 flex flex-wrap gap-2'>
        {youtubeVideoIds.map((videoId, index) => (
          <ExternalServiceLink
            key={videoId}
            href={`https://youtube.com/watch?v=${encodeURIComponent(videoId)}`}
            label={
              youtubeVideoIds.length === 1 ? 'Watch' : `Video ${index + 1}`
            }
            ariaLabel={
              youtubeVideoIds.length === 1
                ? `Watch ${artist} ${title} on YouTube`
                : `Watch ${artist} ${title} video ${index + 1} on YouTube`
            }
            icon={<SiYoutube className='h-3.5 w-3.5 text-red-500' />}
          />
        ))}
        {showYoutubeSearch && (
          <ExternalServiceLink
            href={`${YOUTUBE_SEARCH_BASE}${encodeURIComponent(youtubeSearchQuery)}`}
            label='Search YouTube'
            ariaLabel={`Search YouTube for ${artist} ${title}`}
            icon={<FiSearch className='search-icon h-3.5 w-3.5' />}
            className='border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/35 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200'
          />
        )}
      </div>
      {uniqueSpotifyUrls.length > 0 && (
        <div className='col-start-2 row-start-1 flex flex-wrap gap-2'>
          {uniqueSpotifyUrls.map((url) => (
            <ExternalServiceLink
              key={url}
              href={url}
              label='Spotify'
              ariaLabel={`Listen to ${artist} ${title} on Spotify`}
              icon={<SiSpotify className='h-3.5 w-3.5 text-[#1DB954]' />}
            />
          ))}
        </div>
      )}
      {uniqueAppleMusicUrls.length > 0 && (
        <div className='col-start-1 row-start-2 flex flex-wrap gap-2'>
          {uniqueAppleMusicUrls.map((url) => (
            <ExternalServiceLink
              key={url}
              href={url}
              label='Apple Music'
              ariaLabel={`Listen to ${artist} ${title} on Apple Music`}
              icon={<SiApplemusic className='h-3.5 w-3.5 text-[#FA243C]' />}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExternalServiceLink({
  href,
  label,
  ariaLabel,
  icon,
  className,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Link
      className={cn(LINK_CLASS, className)}
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={ariaLabel}
    >
      <span aria-hidden='true'>{icon}</span>
      {label}
    </Link>
  );
}

function unique(values: string[]) {
  return [...new Set(values)];
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
