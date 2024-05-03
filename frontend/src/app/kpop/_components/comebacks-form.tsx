import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import useURLState from '@/hooks/use-url-state';
import { clearFormInputs, searchParamsToFormData } from '@/lib/utils';
import { useEffect } from 'react';

import ComebackFormInput from './comeback-form-input';

export default function ComebacksForm() {
  const { router, pathname, searchParams, formDataToURLState, clearURLState } =
    useURLState({
      formKeys,
    });
  const debounce = useDebounce(300);
  const defaultFormData = searchParamsToFormData(searchParams);

  useEffect(() => {
    if (defaultFormData.get('start-date') !== null) {
      return;
    }
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('start-date', recentDate());
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  }, []);

  return (
    <form
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
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
              debounce(() => formDataToURLState(formData));
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
            debounce(() => formDataToURLState(formData));
          }}
        />
        <label className='ml-2'>Exact Artist Match</label>
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
    </form>
  );
}

const namesAndPlaceHolders = [
  {
    name: 'start-date',
    placeholder: 'Start Date (YYYY-MM-DD)',
  },
  {
    name: 'end-date',
    placeholder: 'End Date (YYYY-MM-DD)',
  },
  {
    name: 'artist',
    placeholder: 'Artist',
  },
  {
    name: 'title',
    placeholder: 'Title',
  },
  {
    name: 'exact',
    placeholder: 'Exact Artist Match',
  },
];
const formKeys = namesAndPlaceHolders.map(({ name }) => name);

function recentDate(pastDays: number = 3) {
  const today = new Date();
  today.setDate(today.getDate() - pastDays);
  return today.toISOString().split('T')[0];
}
