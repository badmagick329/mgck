'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import useURLState from '@/hooks/useUrlState';
import { formKeys, namesAndPlaceHolders } from '@/lib/kpop';
import {
  buildClearSearchParams,
  buildRecentSearchParams,
  buildTimelineShiftSearchParams,
  buildTodaySearchParams,
  getTimelineLabel,
  searchParamsToKpopQueryState,
} from '@/lib/kpop/query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import ComebackFormInput from './ComebackFormInput';

type Debounce = ReturnType<typeof useDebounce>;
type FormDataToURLState = (
  formData: FormData,
  searchParams?: URLSearchParams | undefined
) => void;

export default function ComebacksForm() {
  const debounce = useDebounce(350);
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

  return (
    <div className='flex w-full max-w-5xl flex-col gap-5 rounded-sm border border-primary-kp/25 bg-background/40 px-4 py-4 md:px-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
        <div className='flex flex-col gap-1'>
          <h3 className='mt-2 text-2xl font-semibold'>{timelineLabel}</h3>
          <p className='text-sm text-muted-foreground'>
            Browse by week, refine the search with artist or title filters.
          </p>
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          <Button
            variant='outline'
            className='border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
            onClick={onTimelineClick(searchParams, pathname, router, 'earlier')}
          >
            <ChevronLeft className='mr-2 h-4 w-4' />
            Earlier
          </Button>
          <Button
            variant='outline'
            className='border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
            onClick={onTimelineClick(searchParams, pathname, router, 'later')}
          >
            Later
            <ChevronRight className='ml-2 h-4 w-4' />
          </Button>
          <Button
            className='bg-primary-kp/80 hover:bg-primary-kp'
            onClick={onPresetClick(searchParams, pathname, router, 'recent')}
          >
            Recent
          </Button>
          <Button
            className='bg-primary-kp/80 hover:bg-primary-kp'
            onClick={onPresetClick(searchParams, pathname, router, 'today')}
          >
            Today
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className='flex flex-col gap-4'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
          {namesAndPlaceHolders
            .slice(0, namesAndPlaceHolders.length - 1)
            .map(({ name, placeholder }) => (
              <ComebackFormInput
                key={`${name}:${searchParams.get(name) || ''}`}
                name={name}
                placeholder={placeholder}
                defaultValue={searchParams.get(name) || ''}
                onChange={onInputChange(
                  debounce,
                  searchParams,
                  formDataToURLState
                )}
              />
            ))}
          <label className='flex items-center gap-3 rounded-sm border border-primary-kp/35 px-3 py-2 text-sm'>
            <Input
              key={`exact:${queryState.exact ? 'on' : 'off'}`}
              type='checkbox'
              name='exact'
              className='h-5 w-5 border-2'
              defaultChecked={queryState.exact}
              onChange={toggleExactSearch(
                debounce,
                searchParams,
                formDataToURLState
              )}
            />
            <span>Exact Match</span>
          </label>
        </div>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='outline'
            className='border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
            onClick={onClearClick(pathname, router)}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

function onTimelineClick(
  searchParams:
    | URLSearchParams
    | ReturnType<typeof useURLState>['searchParams'],
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  direction: 'earlier' | 'later'
) {
  return () => {
    const nextSearchParams = buildTimelineShiftSearchParams(
      searchParams,
      direction
    );
    router.replace(`${pathname}?${nextSearchParams.toString()}`);
  };
}

function onPresetClick(
  searchParams:
    | URLSearchParams
    | ReturnType<typeof useURLState>['searchParams'],
  pathname: string,
  router: ReturnType<typeof useURLState>['router'],
  preset: 'recent' | 'today'
) {
  return () => {
    const nextSearchParams =
      preset === 'recent'
        ? buildRecentSearchParams(searchParams)
        : buildTodaySearchParams(searchParams);
    router.replace(`${pathname}?${nextSearchParams.toString()}`);
  };
}

function onInputChange(
  debounce: Debounce,
  searchParams: ReturnType<typeof useURLState>['searchParams'],
  formDataToURLState: FormDataToURLState
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form;
    const formData = new FormData(form || undefined);
    debounce(() => {
      const oldSearchParams = new URLSearchParams(searchParams.toString());
      if (oldSearchParams.has('page')) {
        oldSearchParams.delete('page');
      }
      formDataToURLState(formData, oldSearchParams);
    });
  };
}

function toggleExactSearch(
  debounce: Debounce,
  searchParams: ReturnType<typeof useURLState>['searchParams'],
  formDataToURLState: FormDataToURLState
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form;
    if (!form) {
      return;
    }
    const formData = new FormData(form);
    if (e.currentTarget.checked) {
      formData.set('exact', 'on');
    } else {
      formData.delete('exact');
    }
    debounce(() => {
      const oldSearchParams = new URLSearchParams(searchParams.toString());
      oldSearchParams.delete('page');
      formDataToURLState(formData, oldSearchParams);
    });
  };
}

function onClearClick(
  pathname: string,
  router: ReturnType<typeof useURLState>['router']
) {
  return () => {
    const searchParams = buildClearSearchParams(new URLSearchParams());
    router.replace(`${pathname}?${searchParams.toString()}`);
  };
}
