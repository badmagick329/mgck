'use client';

import { ComebackResponse, ComebacksResult } from '@/lib/types/kpop';
import { useCallback, useEffect, useRef, useState } from 'react';

type PageLoader = (
  page: number,
  signal: AbortSignal
) => Promise<ComebacksResult>;

type UsePaginatedComebacksOptions = {
  queryKey: string;
  loadPage: PageLoader;
  initialResult?: ComebacksResult;
  initialPage?: number;
  enabled?: boolean;
};

export default function usePaginatedComebacks({
  queryKey,
  loadPage,
  initialResult,
  initialPage = 1,
  enabled = true,
}: UsePaginatedComebacksOptions) {
  const [comebacks, setComebacks] = useState<ComebackResponse[]>(
    initialResult?.results ?? []
  );
  const [totalCount, setTotalCount] = useState(initialResult?.count ?? 0);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(
    initialResult ? initialPage < initialResult.total_pages : false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const activeRequest = useRef<AbortController | null>(null);

  const loadInitial = useCallback(() => {
    activeRequest.current?.abort();

    if (initialResult) {
      setComebacks(initialResult.results);
      setTotalCount(initialResult.count);
      setPage(initialPage);
      setHasMore(initialPage < initialResult.total_pages);
      setIsLoading(false);
      setLoadError('');
      return;
    }

    if (!enabled) {
      setComebacks([]);
      setTotalCount(0);
      setPage(1);
      setHasMore(false);
      setIsLoading(false);
      setLoadError('');
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setComebacks([]);
    setTotalCount(0);
    setPage(1);
    setHasMore(false);
    setIsLoading(true);
    setLoadError('');
    void loadPage(1, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        setComebacks(result.results);
        setTotalCount(result.count);
        setHasMore(result.total_pages > 1);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : 'unknown_error'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          activeRequest.current = null;
          setIsLoading(false);
        }
      });
  }, [enabled, initialPage, initialResult, loadPage]);

  useEffect(() => {
    loadInitial();
    return () => activeRequest.current?.abort();
  }, [loadInitial, queryKey]);

  const canLoadMore = hasMore && !isLoading && comebacks.length < totalCount;

  const loadMore = useCallback(async () => {
    if (!canLoadMore) {
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    const nextPage = page + 1;
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await loadPage(nextPage, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setComebacks((current) => [
        ...current,
        ...result.results.filter(
          (incoming) => !current.some((existing) => existing.id === incoming.id)
        ),
      ]);
      setPage(nextPage);
      setHasMore(nextPage < result.total_pages);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : 'unknown_error');
      }
    } finally {
      if (!controller.signal.aborted) {
        activeRequest.current = null;
        setIsLoading(false);
      }
    }
  }, [canLoadMore, loadPage, page]);

  return {
    comebacks,
    totalCount,
    isLoading,
    loadError,
    canLoadMore,
    loadInitial,
    loadMore,
  };
}
