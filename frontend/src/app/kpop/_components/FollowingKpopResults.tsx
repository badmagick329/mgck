'use client';

import { Button } from '@/components/ui/button';
import { fetchWatchlistComebacks } from '@/lib/kpop';
import { getFollowingStartDate } from '@/lib/kpop/query';
import { ComebackResponse } from '@/lib/types/kpop';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import usePaginatedComebacks from '../_hooks/usePaginatedComebacks';
import { useFollowing } from '../_context/FollowingStore';
import KpopResults from './KpopResults';

export default function FollowingKpopResults() {
  const { artists, isLoaded, openManager } = useFollowing();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const artistPublicIds = useMemo(
    () => artists.map((artist) => artist.publicId).sort(),
    [artists]
  );
  const startDate = getFollowingStartDate();
  const loadPage = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchWatchlistComebacks(
        {
          artist_public_ids: artistPublicIds,
          start_date: startDate,
          page,
          page_size: 10,
          ordering: 'upcoming_first',
        },
        signal
      ),
    [artistPublicIds, startDate]
  );
  const {
    comebacks,
    totalCount,
    isLoading,
    loadError,
    canLoadMore,
    loadInitial,
    loadMore,
  } = usePaginatedComebacks({
    queryKey: artistPublicIds.join(','),
    enabled: isLoaded && artistPublicIds.length > 0,
    loadPage,
  });

  useEffect(() => {
    if (!canLoadMore || !loadMoreRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && void loadMore(),
      { rootMargin: '300px 0px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  if (!isLoaded || (isLoading && comebacks.length === 0)) {
    return <LoadingState label='Loading followed artist releases...' />;
  }
  if (artistPublicIds.length === 0) {
    return (
      <FollowingState
        title='Follow artists to build your timeline'
        description='Search for artists you care about, then see their upcoming and recent releases here.'
        onAction={openManager}
      />
    );
  }
  if (loadError && comebacks.length === 0) {
    return (
      <FollowingState
        title='Could not load your following timeline'
        description='Please try again.'
        onAction={loadInitial}
        actionLabel='Try again'
      />
    );
  }
  if (comebacks.length === 0) {
    return (
      <FollowingState
        title='Nothing upcoming or recently released'
        description='Try managing the artists you follow or check back for the next release.'
        onAction={openManager}
      />
    );
  }

  const [upcoming, recent] = splitByToday(comebacks);
  return (
    <div className='flex min-h-full w-full flex-1 flex-col gap-8'>
      <div className='flex w-full justify-between gap-4 text-sm text-muted-foreground'>
        <span>
          {totalCount} matching followed release{totalCount === 1 ? '' : 's'}
        </span>
        <span>
          {comebacks.length} of {totalCount} loaded
        </span>
      </div>
      {upcoming.length > 0 && <Section title='Upcoming' comebacks={upcoming} />}
      {recent.length > 0 && (
        <Section title='Recently released' comebacks={recent} />
      )}
      {(canLoadMore || isLoading || loadError) && (
        <div className='flex w-full flex-col items-center gap-3 pt-2'>
          <div ref={loadMoreRef} className='h-px w-full' />
          {isLoading && (
            <LoadingState label='Loading more releases...' compact />
          )}
          {!isLoading && loadError && (
            <Button
              type='button'
              variant='outline'
              onClick={() => void loadMore()}
            >
              Try again
            </Button>
          )}
          {!isLoading && canLoadMore && !loadError && (
            <Button
              type='button'
              variant='outline'
              onClick={() => void loadMore()}
            >
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function splitByToday(comebacks: ComebackResponse[]) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    comebacks.filter((comeback) => comeback.date >= today),
    comebacks.filter((comeback) => comeback.date < today),
  ];
}

function Section({
  title,
  comebacks,
}: {
  title: string;
  comebacks: ComebackResponse[];
}) {
  return (
    <section className='flex flex-col gap-4'>
      <h2 className='text-xl font-semibold'>{title}</h2>
      <KpopResults comebacks={comebacks} />
    </section>
  );
}

function FollowingState({
  title,
  description,
  onAction,
  actionLabel = 'Manage artists',
}: {
  title: string;
  description: string;
  onAction: () => void;
  actionLabel?: string;
}) {
  return (
    <div className='flex min-h-[16rem] w-full flex-1 flex-col items-center justify-center gap-4 rounded-sm border border-dashed border-primary-kp/35 bg-primary-kp/5 px-6 py-12 text-center'>
      <h2 className='text-xl font-semibold'>{title}</h2>
      <p className='max-w-lg text-sm text-muted-foreground'>{description}</p>
      <Button type='button' onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function LoadingState({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2 text-sm text-muted-foreground'
          : 'flex min-h-[16rem] items-center justify-center gap-2 text-muted-foreground'
      }
    >
      <Loader2 className='h-4 w-4 animate-spin' />
      {label}
    </div>
  );
}
