'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useURLState from '@/hooks/useUrlState';
import { formKeys, namesAndPlaceHolders } from '@/lib/kpop';
import {
  buildAllSearchParams,
  buildFollowingSearchParams,
  buildRecentSearchParams,
  buildTimelineShiftSearchParams,
  buildTodaySearchParams,
  canShiftTimelineEarlier,
  getActiveKpopPreset,
  getTimelineLabel,
  getKpopView,
  searchParamsToKpopQueryState,
} from '@/lib/kpop/query';
import { ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import {
  FOLLOWING_LOOKBACK_OPTIONS,
  useFollowing,
} from '../_context/FollowingStore';
import ComebackFormInput from './ComebackFormInput';

export default function ComebacksForm() {
  const [isSearching, startSearchTransition] = useTransition();
  const { router, pathname, searchParams, formDataToURLState } = useURLState({
    formKeys,
  });

  const queryState = useMemo(
    () => searchParamsToKpopQueryState(searchParams),
    [searchParams]
  );
  const timelineLabel = useMemo(
    () => getTimelineLabel(queryState),
    [queryState]
  );
  const kpopView = getKpopView(searchParams);
  const isFollowingView = kpopView === 'following';
  const hasSearchFilters =
    namesAndPlaceHolders.some(({ name }) => searchParams.has(name)) ||
    searchParams.has('exact');
  const [searchOpen, setSearchOpen] = useState(hasSearchFilters);
  useEffect(() => setSearchOpen(hasSearchFilters), [hasSearchFilters]);
  const isTimelineView = !isFollowingView && !searchOpen;
  const activePreset = getActiveKpopPreset(searchParams);
  const canGoEarlier = canShiftTimelineEarlier(queryState);
  const { isLoaded, openManager, preferences, setLookbackDays, setOrdering } =
    useFollowing();

  return (
    <div className='flex w-full max-w-5xl flex-col gap-5 rounded-sm border border-primary-kp/25 bg-background/40 px-4 py-4 md:px-6'>
      <div
        className='flex flex-wrap gap-2 border-b border-primary-kp/20 pb-4'
        aria-label='K-pop browse mode'
      >
        <Button
          type='button'
          variant={!isFollowingView && !searchOpen ? 'default' : 'outline'}
          className={modeButtonClass(isTimelineView)}
          onClick={() => {
            setSearchOpen(false);
            startSearchTransition(() =>
              router.replace(
                `${pathname}?${buildRecentSearchParams(searchParams).toString()}`
              )
            );
          }}
        >
          Timeline
        </Button>
        <Button
          type='button'
          variant={isFollowingView ? 'default' : 'outline'}
          className={modeButtonClass(isFollowingView)}
          onClick={onFollowingClick(
            searchParams,
            pathname,
            router,
            startSearchTransition
          )}
        >
          Following
        </Button>
        <Button
          type='button'
          variant={searchOpen && !isFollowingView ? 'default' : 'outline'}
          className={modeButtonClass(searchOpen && !isFollowingView)}
          onClick={() => {
            setSearchOpen(true);
            startSearchTransition(() =>
              router.replace(
                `${pathname}?${buildAllSearchParams(searchParams).toString()}`
              )
            );
          }}
        >
          Search
        </Button>
      </div>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
        <div className='flex flex-col gap-1'>
          <h3 className='mt-2 text-2xl font-semibold'>
            {isFollowingView
              ? 'Following'
              : searchOpen
                ? 'Search archive'
                : timelineLabel}
          </h3>
          <p className='text-sm text-muted-foreground'>
            {isFollowingView
              ? followingDescription(
                  preferences.lookbackDays,
                  preferences.ordering
                )
              : searchOpen
                ? 'Find releases across the full archive.'
                : 'Browse by week, refine the search with artist or title filters.'}
          </p>
        </div>
        <div className='flex flex-wrap justify-end gap-2'>
          {isTimelineView && (
            <>
              <Button
                variant='outline'
                className='whitespace-nowrap border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
                onClick={onTimelineClick(
                  searchParams,
                  pathname,
                  router,
                  'earlier',
                  startSearchTransition
                )}
                disabled={isSearching || !canGoEarlier}
              >
                <ChevronLeft className='mr-2 h-4 w-4' />
                Earlier
              </Button>
              <Button
                variant='outline'
                className='whitespace-nowrap border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
                onClick={onTimelineClick(
                  searchParams,
                  pathname,
                  router,
                  'later',
                  startSearchTransition
                )}
                disabled={isSearching}
              >
                Later
                <ChevronRight className='ml-2 h-4 w-4' />
              </Button>
            </>
          )}
          {isTimelineView && (
            <>
              <Button
                variant={activePreset === 'recent' ? 'default' : 'outline'}
                className={presetButtonClass(activePreset === 'recent')}
                onClick={onPresetClick(
                  searchParams,
                  pathname,
                  router,
                  'recent',
                  startSearchTransition
                )}
                disabled={isSearching}
                aria-pressed={activePreset === 'recent'}
              >
                Recent
              </Button>
              <Button
                variant={activePreset === 'today' ? 'default' : 'outline'}
                className={presetButtonClass(activePreset === 'today')}
                onClick={onPresetClick(
                  searchParams,
                  pathname,
                  router,
                  'today',
                  startSearchTransition
                )}
                disabled={isSearching}
                aria-pressed={activePreset === 'today'}
              >
                Today
              </Button>
            </>
          )}
          {isFollowingView && (
            <Button
              type='button'
              variant='outline'
              className='whitespace-nowrap border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
              onClick={openManager}
              disabled={!isLoaded}
            >
              <Users className='mr-2 h-4 w-4' />
              Manage
            </Button>
          )}
        </div>
      </div>

      {isFollowingView && (
        <div className='flex flex-col gap-3 border-t border-primary-kp/20 pt-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='mr-1 text-sm text-muted-foreground'>
              Past releases
            </span>
            {FOLLOWING_LOOKBACK_OPTIONS.map((lookbackDays) => (
              <Button
                key={lookbackDays}
                type='button'
                size='sm'
                variant={
                  preferences.lookbackDays === lookbackDays
                    ? 'default'
                    : 'outline'
                }
                className={preferenceButtonClass(
                  preferences.lookbackDays === lookbackDays
                )}
                onClick={() => setLookbackDays(lookbackDays)}
                disabled={!isLoaded}
              >
                {lookbackDays} days
              </Button>
            ))}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='mr-1 text-sm text-muted-foreground'>Order</span>
            <Button
              type='button'
              size='sm'
              variant={
                preferences.ordering === 'upcoming_first'
                  ? 'default'
                  : 'outline'
              }
              className={preferenceButtonClass(
                preferences.ordering === 'upcoming_first'
              )}
              onClick={() => setOrdering('upcoming_first')}
              disabled={!isLoaded}
            >
              Upcoming first
            </Button>
            <Button
              type='button'
              size='sm'
              variant={
                preferences.ordering === 'recent_first' ? 'default' : 'outline'
              }
              className={preferenceButtonClass(
                preferences.ordering === 'recent_first'
              )}
              onClick={() => setOrdering('recent_first')}
              disabled={!isLoaded}
            >
              Newest released
            </Button>
          </div>
        </div>
      )}

      {!isFollowingView && searchOpen && (
        <form
          onSubmit={onSearchSubmit(
            searchParams,
            formDataToURLState,
            startSearchTransition
          )}
          className='flex flex-col gap-4'
        >
          <p className='text-sm text-muted-foreground'>
            Use artist, title, and exact-match filters to narrow the archive.
          </p>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
            {namesAndPlaceHolders
              .slice(0, namesAndPlaceHolders.length - 1)
              .map(({ name, placeholder }) => (
                <ComebackFormInput
                  key={`${name}:${searchParams.get(name) || ''}`}
                  name={name}
                  placeholder={placeholder}
                  defaultValue={searchParams.get(name) || ''}
                  disabled={isSearching}
                />
              ))}
            <label className='flex items-center gap-3 rounded-sm border border-primary-kp/35 px-3 py-2 text-sm'>
              <Input
                key={`exact:${queryState.exact ? 'on' : 'off'}`}
                type='checkbox'
                name='exact'
                className='h-5 w-5 border-2'
                defaultChecked={queryState.exact}
                disabled={isSearching}
              />
              <span>Exact Match</span>
            </label>
          </div>
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              type='submit'
              className='bg-primary-kp/80 hover:bg-primary-kp'
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
              onClick={onClearClick(pathname, router, startSearchTransition)}
              disabled={isSearching}
            >
              Clear
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function presetButtonClass(isActive: boolean) {
  return isActive
    ? 'whitespace-nowrap bg-primary-kp hover:bg-primary-kp/90'
    : 'whitespace-nowrap border-primary-kp/40 bg-transparent hover:bg-primary-kp/10';
}

function modeButtonClass(isActive: boolean) {
  return isActive
    ? 'bg-primary-kp text-primary-foreground hover:bg-primary-kp/90'
    : 'border-primary-kp/40 bg-transparent hover:bg-primary-kp/10';
}

function preferenceButtonClass(isActive: boolean) {
  return isActive
    ? 'bg-primary-kp text-primary-foreground hover:bg-primary-kp/90'
    : 'border-primary-kp/40 bg-transparent hover:bg-primary-kp/10';
}

function followingDescription(
  lookbackDays: number,
  ordering: 'upcoming_first' | 'recent_first'
) {
  if (ordering === 'recent_first') {
    return `Latest releases from the past ${lookbackDays} days first, followed by upcoming releases.`;
  }
  return `Upcoming releases first, followed by the latest releases from the past ${lookbackDays} days.`;
}

function onTimelineClick(
  searchParams:
    | URLSearchParams
    | ReturnType<typeof useURLState>['searchParams'],
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  direction: 'earlier' | 'later',
  startSearchTransition: (callback: () => void) => void
) {
  return () => {
    const nextSearchParams = buildTimelineShiftSearchParams(
      searchParams,
      direction
    );
    startSearchTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}`);
    });
  };
}

function onPresetClick(
  searchParams:
    | URLSearchParams
    | ReturnType<typeof useURLState>['searchParams'],
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  preset: 'recent' | 'today',
  startSearchTransition: (callback: () => void) => void
) {
  return () => {
    const nextSearchParams =
      preset === 'recent'
        ? buildRecentSearchParams(searchParams)
        : buildTodaySearchParams(searchParams);
    startSearchTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}`);
    });
  };
}

function onFollowingClick(
  searchParams:
    | URLSearchParams
    | ReturnType<typeof useURLState>['searchParams'],
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  startSearchTransition: (callback: () => void) => void
) {
  return () => {
    const nextSearchParams = buildFollowingSearchParams(searchParams);
    startSearchTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}`);
    });
  };
}

function onSearchSubmit(
  searchParams: ReturnType<typeof useURLState>['searchParams'],
  formDataToURLState: ReturnType<typeof useURLState>['formDataToURLState'],
  startSearchTransition: (callback: () => void) => void
) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const oldSearchParams = new URLSearchParams(searchParams.toString());
    oldSearchParams.delete('view');
    if (oldSearchParams.has('page')) {
      oldSearchParams.delete('page');
    }
    startSearchTransition(() => {
      formDataToURLState(formData, oldSearchParams);
    });
  };
}

function onClearClick(
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  startSearchTransition: (callback: () => void) => void
) {
  return () => {
    const searchParams = buildAllSearchParams(new URLSearchParams());
    startSearchTransition(() => {
      router.replace(`${pathname}?${searchParams.toString()}`);
    });
  };
}
