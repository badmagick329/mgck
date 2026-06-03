'use client';

import { Button } from '@/components/ui/button';
import { API_KPOP } from '@/lib/consts/urls';
import { getKpopApiQuery, KpopQueryState } from '@/lib/kpop/query';
import {
  ComebackResponse,
  ComebacksResult,
  ComebacksResultSchema,
} from '@/lib/types/kpop';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import KpopResults from './KpopResults';

type KpopInfiniteResultsProps = {
  initialResult: ComebacksResult;
  initialState: KpopQueryState;
};

export default function KpopInfiniteResults({
  initialResult,
  initialState,
}: KpopInfiniteResultsProps) {
  const [comebacks, setComebacks] = useState<ComebackResponse[]>(
    initialResult.results
  );
  const [page, setPage] = useState(initialState.page);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [hasMore, setHasMore] = useState(
    initialState.page < initialResult.total_pages
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  const queryKey = useMemo(() => {
    const { page, ...queryWithoutPage } = getKpopApiQuery({
      ...initialState,
      page: 1,
    });
    return JSON.stringify(queryWithoutPage);
  }, [initialState]);
  const queryKeyRef = useRef(queryKey);

  const loadedCount = comebacks.length;
  const totalCount = initialResult.count;
  const nextPage = page + 1;

  useEffect(() => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    queryKeyRef.current = queryKey;
    setComebacks(initialResult.results);
    setPage(initialState.page);
    setLoading(false);
    setLoadError('');
    setHasMore(initialState.page < initialResult.total_pages);
  }, [initialResult, initialState.page, initialResult.total_pages, queryKey]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  const canLoadMore = useMemo(
    () => hasMore && !loading && loadedCount < totalCount,
    [hasMore, loading, loadedCount, totalCount]
  );

  useEffect(() => {
    if (!canLoadMore || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      {
        rootMargin: '300px 0px',
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, nextPage]);

  async function loadMore() {
    if (!canLoadMore) {
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const requestQueryKey = queryKeyRef.current;
      const controller = new AbortController();
      activeRequestRef.current = controller;
      const query = getKpopApiQuery({
        ...initialState,
        page: nextPage,
      });
      const apiUrl = new URL(API_KPOP, window.location.origin);
      for (const [key, value] of Object.entries(query)) {
        if (value) {
          apiUrl.searchParams.set(key, value);
        }
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }

      const data = await response.json();
      const parsed = ComebacksResultSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error('invalid_response');
      }

      if (requestQueryKey !== queryKeyRef.current) {
        return;
      }

      setComebacks((current) => [
        ...current,
        ...parsed.data.results.filter(
          (incoming) => !current.some((existing) => existing.id === incoming.id)
        ),
      ]);
      setPage(nextPage);
      setHasMore(nextPage < parsed.data.total_pages);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setLoadError(
        error instanceof Error ? error.message : 'unknown_error'
      );
    } finally {
      activeRequestRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className='flex min-h-full w-full flex-1 flex-col items-center gap-6'>
      <div className='flex w-full justify-between gap-4 text-sm text-muted-foreground'>
        <span>
          {totalCount} matching release{totalCount === 1 ? '' : 's'}
        </span>
        <span>
          {loadedCount} of {totalCount} loaded
        </span>
      </div>
      <KpopResults comebacks={comebacks} />
      {(canLoadMore || loading || loadError) && (
        <div className='flex w-full flex-col items-center gap-3 pt-2'>
          <div ref={loadMoreRef} className='h-px w-full' />
          {loading && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading more releases...
            </div>
          )}
          {!loading && loadError && (
            <div className='flex flex-col items-center gap-3'>
              <p className='text-sm text-muted-foreground'>
                Could not load more releases.
              </p>
              <Button
                type='button'
                variant='outline'
                className='rounded-sm border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
                onClick={() => void loadMore()}
              >
                Try again
              </Button>
            </div>
          )}
          {!loading && canLoadMore && !loadError && (
            <Button
              type='button'
              variant='outline'
              className='rounded-sm border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
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
