import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import useURLState from '@/hooks/useUrlState';
import { MEDIUM_ICON } from '@/lib/consts/kpop';
import { searchParamsToFormData } from '@/lib/utils';
import { clearFormInputs } from '@/lib/kpop';
import {
  formKeys,
  getRecentDateParams,
  namesAndPlaceHolders,
  recentDate,
  searchParamsAreEmpty,
} from '@/lib/kpop';
import {
  getNextPageURL,
  getPreviousPageURL,
  hasNextPage,
  hasPreviousPage,
} from '@/lib/kpop/page-handlers';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import ComebackFormInput from './ComebackFormInput';

type Debounce = ReturnType<typeof useDebounce>;
type FormDataToURLState = (
  formData: FormData,
  searchParams?: URLSearchParams | undefined
) => void;

export default function ComebacksForm({ totalPages }: { totalPages: number }) {
  const DEBOUNCE_TIME = 350;
  const { router, pathname, searchParams, formDataToURLState, clearURLState } =
    useURLState({ formKeys });
  const debounce = useDebounce(DEBOUNCE_TIME);
  const defaultFormData = searchParamsToFormData(searchParams);

  useEffect(() => {
    if (!searchParamsAreEmpty(searchParams)) {
      return;
    }
    const newSearchParams = getRecentDateParams(searchParams);
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  }, []);
  const previousIsDisabled = !hasPreviousPage(searchParams);
  const nextIsDisabled = !hasNextPage(searchParams, totalPages);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {!previousIsDisabled && (
        <Button
          variant='plainBorder'
          className='fixed left-0 top-[45%] ml-1 h-36 bg-gray-500/10 active:bg-gray-500/10 dark:bg-gray-50/5 dark:active:bg-gray-50/5'
          size='icon'
          onClick={onPreviousClick(searchParams, pathname, router)}
        >
          <ChevronLeft size={MEDIUM_ICON} />
        </Button>
      )}
      {!nextIsDisabled && (
        <Button
          variant='plainBorder'
          className='fixed right-0 top-[45%] mr-1 h-36 bg-gray-500/10 active:bg-gray-500/10 dark:bg-gray-50/5 dark:active:bg-gray-50/5'
          size='icon'
          disabled={nextIsDisabled}
          onClick={onNextClick(searchParams, pathname, totalPages, router)}
        >
          <ChevronRight size={MEDIUM_ICON} />
        </Button>
      )}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {namesAndPlaceHolders
          .slice(0, namesAndPlaceHolders.length - 1)
          .map(({ name, placeholder }) => (
            <ComebackFormInput
              key={name}
              name={name}
              placeholder={placeholder}
              defaultValue={defaultFormData.get(name)?.toString() || ''}
              onChange={onInputChange(
                debounce,
                searchParams,
                formDataToURLState
              )}
            />
          ))}
        <div className='flex items-center'>
          <Input
            type='checkbox'
            name='exact'
            className='h-5 w-5 border-2'
            defaultChecked={defaultFormData.get('exact') === 'on'}
            onChange={toggleExactSearch(
              debounce,
              searchParams,
              formDataToURLState
            )}
          />
          <label className='pl-2'>Exact Match</label>
        </div>
        <div className='flex justify-between gap-2'>
          <Button
            className='bg-primary-kp/80 hover:bg-primary-kp'
            onClick={onRecentClick(formDataToURLState, searchParams)}
          >
            Recent
          </Button>
          <Button
            className='bg-primary-kp/80 hover:bg-primary-kp'
            onClick={onTodayClick(formDataToURLState, searchParams)}
          >
            Today
          </Button>
          <Button
            className='bg-primary-kp/80 hover:bg-primary-kp'
            onClick={onClearClick(clearURLState)}
          >
            Clear
          </Button>
        </div>
      </div>
    </form>
  );
}

function onNextClick(
  searchParams: ReadonlyURLSearchParams,
  pathname: string,
  totalPages: number,
  router: AppRouterInstance
) {
  return () => {
    const newURL = getNextPageURL(searchParams, pathname, totalPages);
    if (newURL) {
      router.replace(newURL);
      router.refresh();
    }
  };
}

function onPreviousClick(
  searchParams: ReadonlyURLSearchParams,
  pathname: string,
  router: AppRouterInstance
) {
  return () => {
    const newURL = getPreviousPageURL(searchParams, pathname);
    if (newURL) {
      router.replace(newURL);
      router.refresh();
    }
  };
}

function onInputChange(
  debounce: Debounce,
  searchParams: ReadonlyURLSearchParams,
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

function onClearClick(clearURLState: () => void) {
  return (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    clearURLState();
    clearFormInputs(e.currentTarget.form);
  };
}

function onTodayClick(
  formDataToURLState: FormDataToURLState,
  searchParams: ReadonlyURLSearchParams
) {
  return (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const form = e.currentTarget.form;
    if (!form) {
      return;
    }
    const startDateInput = form.querySelector<HTMLInputElement>(
      'input[name="start-date"]'
    );
    if (!startDateInput) {
      return;
    }
    const endDateInput = form.querySelector<HTMLInputElement>(
      'input[name="end-date"]'
    );
    if (!endDateInput) {
      return;
    }
    startDateInput.value = recentDate(0);
    endDateInput.value = recentDate(0);
    const formData = new FormData(form);
    const oldSearchParams = new URLSearchParams(searchParams.toString());
    if (oldSearchParams.has('page')) {
      oldSearchParams.delete('page');
    }
    formDataToURLState(formData, oldSearchParams);
  };
}

function onRecentClick(
  formDataToURLState: FormDataToURLState,
  searchParams: ReadonlyURLSearchParams
) {
  return (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const form = e.currentTarget.form;
    if (!form) {
      return;
    }
    const startDateInput = form.querySelector<HTMLInputElement>(
      'input[name="start-date"]'
    );
    if (!startDateInput) {
      return;
    }
    const endDateInput = form.querySelector<HTMLInputElement>(
      'input[name="end-date"]'
    );
    if (!endDateInput) {
      return;
    }
    startDateInput.value = recentDate();
    endDateInput.value = '';
    const formData = new FormData(form);
    const oldSearchParams = new URLSearchParams(searchParams.toString());
    if (oldSearchParams.has('page')) {
      oldSearchParams.delete('page');
    }
    formDataToURLState(formData, oldSearchParams);
  };
}

function toggleExactSearch(
  debounce: Debounce,
  searchParams: ReadonlyURLSearchParams,
  formDataToURLState: FormDataToURLState
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form;
    if (!form) {
      return;
    }
    const formData = new FormData(form || undefined);
    if (e.currentTarget.checked) {
      formData.set('exact', 'on');
    } else {
      formData.set('exact', '');
    }
    debounce(() => {
      const oldSearchParams = new URLSearchParams(searchParams.toString());
      if (oldSearchParams.has('page')) {
        oldSearchParams.delete('page');
      }
      formDataToURLState(formData, oldSearchParams);
    });
  };
}
