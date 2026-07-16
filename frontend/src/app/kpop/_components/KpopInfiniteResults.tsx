'use client';

import { Button } from '@/components/ui/button';
import { API_KPOP } from '@/lib/consts/urls';
import { getKpopApiQuery, KpopQueryState } from '@/lib/kpop/query';
import { ComebacksResult, ComebacksResultSchema } from '@/lib/types/kpop';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import usePaginatedComebacks from '../_hooks/usePaginatedComebacks';
import KpopResults from './KpopResults';

type KpopInfiniteResultsProps = {
  initialResult: ComebacksResult;
  initialState: KpopQueryState;
};

export default function KpopInfiniteResults({
  initialResult,
  initialState,
}: KpopInfiniteResultsProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryKey = useMemo(() => {
    const { page, ...queryWithoutPage } = getKpopApiQuery({
      ...initialState,
      page: 1,
    });
    return JSON.stringify(queryWithoutPage);
  }, [initialState]);
  const loadPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const query = getKpopApiQuery({ ...initialState, page });
      const apiUrl = new URL(API_KPOP, window.location.origin);
      for (const [key, value] of Object.entries(query)) {
        if (value) {
          apiUrl.searchParams.set(key, value);
        }
      }
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal,
      });
      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }
      const parsed = ComebacksResultSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error('invalid_response');
      }
      return parsed.data;
    },
    [initialState]
  );
  const { comebacks, totalCount, isLoading, loadError, canLoadMore, loadMore } =
    usePaginatedComebacks({
      queryKey,
      loadPage,
      initialResult,
      initialPage: initialState.page,
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

  return (
    <div className='flex min-h-full w-full flex-1 flex-col items-center gap-6'>
      <div className='flex w-full justify-between gap-4 text-sm text-muted-foreground'>
        <span>
          {totalCount} matching release{totalCount === 1 ? '' : 's'}
        </span>
        <span>
          {comebacks.length} of {totalCount} loaded
        </span>
      </div>
      <KpopResults comebacks={comebacks} />
      {(canLoadMore || isLoading || loadError) && (
        <div className='flex w-full flex-col items-center gap-3 pt-2'>
          <div ref={loadMoreRef} className='h-px w-full' />
          {isLoading && <LoadingState />}
          {!isLoading && loadError && (
            <div className='flex flex-col items-center gap-3'>
              <p className='text-sm text-muted-foreground'>
                Could not load more releases.
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={() => void loadMore()}
              >
                Try again
              </Button>
            </div>
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

function LoadingState() {
  return (
    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
      <Loader2 className='h-4 w-4 animate-spin' />
      Loading more releases...
    </div>
  );
}
