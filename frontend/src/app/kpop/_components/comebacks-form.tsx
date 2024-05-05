import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import useURLState from '@/hooks/use-url-state';
import { MEDIUM_ICON } from '@/lib/consts';
import { clearFormInputs, searchParamsToFormData } from '@/lib/utils';
import {
  formKeys,
  getRecentDateParams,
  namesAndPlaceHolders,
  recentDate,
  searchParamsAreEmpty,
} from '@/lib/utils/kpop';
import {
  getNextPageURL,
  getPreviousPageURL,
  hasNextPage,
  hasPreviousPage,
} from '@/lib/utils/pageHandlers';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

import ComebackFormInput from './comeback-form-input';

const DEBOUNCE_TIME = 350;

export default function ComebacksForm({ totalPages }: { totalPages: number }) {
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
          className='fixed left-0 top-[45%] ml-1 h-36 active:bg-background'
          size='icon'
          onClick={() => {
            const newURL = getPreviousPageURL(searchParams, pathname);
            if (newURL) {
              router.replace(newURL);
              router.refresh();
            }
          }}
        >
          <ChevronLeft size={MEDIUM_ICON} />
        </Button>
      )}
      {!nextIsDisabled && (
        <Button
          variant='plainBorder'
          className='fixed right-0 top-[45%] mr-1 h-36 active:bg-background'
          size='icon'
          disabled={nextIsDisabled}
          onClick={() => {
            const newURL = getNextPageURL(searchParams, pathname, totalPages);
            if (newURL) {
              router.replace(newURL);
              router.refresh();
            }
          }}
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
              onChange={(e) => {
                const form = e.currentTarget.form;
                const formData = new FormData(form || undefined);
                debounce(() => {
                  const oldSearchParams = new URLSearchParams(searchParams);
                  if (oldSearchParams.has('page')) {
                    oldSearchParams.delete('page');
                  }
                  formDataToURLState(formData, oldSearchParams);
                });
              }}
            />
          ))}
        <div className='flex items-center'>
          <Input
            type='checkbox'
            name='exact'
            className='h-5 w-5'
            defaultChecked={defaultFormData.get('exact') === 'on'}
            onChange={(e) => {
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
                const oldSearchParams = new URLSearchParams(searchParams);
                if (oldSearchParams.has('page')) {
                  oldSearchParams.delete('page');
                }
                formDataToURLState(formData, oldSearchParams);
              });
            }}
          />
          <label className='ml-2'>Exact Match</label>
        </div>
        <div className='flex justify-between'>
          <Button
            onClick={(e) => {
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
              startDateInput.value = recentDate();
              const formData = new FormData(form);
              formDataToURLState(formData);
            }}
          >
            Show Recent
          </Button>
          <Button
            onClick={(e) => {
              clearURLState();
              clearFormInputs(e.currentTarget.form);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </form>
  );
}
