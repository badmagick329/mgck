import { fetchAccounts } from '@/actions/gfys';
import { Button } from '@/components/ui/button';
import { SearchFormParams, SearchParams } from '@/lib/types/gfys';
import { validDateStringOrNull } from '@/lib/utils';
import { createURL } from '@/lib/utils/gfys';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import AccountSelector from './account-selector';
import SearchTextInput from './search-text-input';

export default function SearchFormContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [formParams, setFormParams] = useState<SearchFormParams>({
    title: '',
    tags: '',
    start_date: '',
    end_date: '',
  });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const titleParam = searchParams.get('title') || '';
    const tagsParam = searchParams.get('tags') || '';
    const startParam = searchParams.get('start_date') || '';
    const endParam = searchParams.get('end_date') || '';

    setFormParams({
      title: titleParam,
      tags: tagsParam,
      start_date: startParam,
      end_date: endParam,
    });
    initializeAccounts(searchParams, setAccounts, setSelectedAccount);
  }, []);

  function clearForm() {
    setFormParams({ title: '', tags: '', start_date: '', end_date: '' });
    setSelectedAccount('All');
    router.push(pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const newURL = getNewURL(
      e,
      formParams,
      searchParams,
      selectedAccount,
      pathname,
      setFormParams
    );
    router.push(newURL);
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        <SearchTextInput
          name={'title'}
          searchParams={searchParams}
          formParams={formParams}
          setFormParams={setFormParams}
          placeholder={'Title'}
          tooltip={'Search by title'}
        />
        <SearchTextInput
          name={'tags'}
          searchParams={searchParams}
          formParams={formParams}
          setFormParams={setFormParams}
          placeholder={'Tags (, separated)'}
          tooltip={'Search by tags separated by commas'}
        />
        <AccountSelector
          accounts={accounts}
          searchParams={searchParams}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
        />
        <SearchTextInput
          name={'start_date'}
          searchParams={searchParams}
          formParams={formParams}
          setFormParams={setFormParams}
          placeholder={'Start Date (YYMMDD)'}
          tooltip={
            'Filter gfys from before this date. Valid formats: YYMMDD, YYYYMMDD, YYYY-MM-DD'
          }
        />
        <SearchTextInput
          name={'end_date'}
          searchParams={searchParams}
          formParams={formParams}
          setFormParams={setFormParams}
          placeholder={'End Date (YYMMDD)'}
          tooltip={
            'Filter gfys after this date. Valid formats: YYMMDD, YYYYMMDD, YYYY-MM-DD'
          }
        />
      </div>
      <div className='flex justify-center gap-2'>
        <Button
          className='bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
          type='submit'
          variant='secondary'
        >
          Search
        </Button>
        <Button
          className='bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
          variant='secondary'
          onClick={clearForm}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}

function getNewURL(
  e: React.FormEvent<HTMLFormElement>,
  formParams: SearchFormParams,
  searchParams: SearchParams,
  selectedAccount: string,
  pathname: string,
  setFormParams: Dispatch<SetStateAction<SearchFormParams>>
) {
  e.preventDefault();
  setFormParams({
    title: formParams.title.trim(),
    tags: formParams.tags.trim(),
    start_date: formParams.start_date.trim(),
    end_date: formParams.end_date.trim(),
  });
  const newParams = createURLparams(
    formParams,
    searchParams,
    selectedAccount,
    true
  );
  const newURL = createURL(pathname, newParams.toString());
  return newURL;
}

function createURLparams(
  formParams: SearchFormParams,
  searchParams: SearchParams,
  selectedAccount: string,
  clearPage: boolean = false
) {
  const urlSearchParams = new URLSearchParams(searchParams.toString());

  if (formParams.title) {
    urlSearchParams.set('title', formParams.title);
  } else {
    urlSearchParams.delete('title');
  }

  if (formParams.tags) {
    urlSearchParams.set('tags', formParams.tags);
  } else {
    urlSearchParams.delete('tags');
  }

  if (selectedAccount && selectedAccount !== 'All') {
    urlSearchParams.set('account', selectedAccount);
  } else {
    urlSearchParams.delete('account');
  }

  const parsedStartDate = validDateStringOrNull(formParams.start_date);
  if (formParams.start_date && parsedStartDate) {
    urlSearchParams.set('start_date', formParams.start_date);
  } else {
    urlSearchParams.delete('start_date');
  }

  const parsedEndDate = validDateStringOrNull(formParams.end_date);
  if (formParams.end_date && parsedEndDate) {
    urlSearchParams.set('end_date', formParams.end_date);
  } else {
    urlSearchParams.delete('end_date');
  }

  if (clearPage) {
    urlSearchParams.delete('page');
  }

  return urlSearchParams;
}

async function initializeAccounts(
  searchParams: SearchParams,
  setAccounts: Dispatch<SetStateAction<string[]>>,
  setSelectedAccount: Dispatch<SetStateAction<string>>
) {
  const resp = await fetchAccounts();
  const newAccounts = ['All', ...resp.accounts];
  setAccounts(newAccounts);
  const accountParam = (searchParams.get('account') || '').trim() as string;
  if (newAccounts.indexOf(accountParam) == -1) {
    setSelectedAccount('All');
  } else {
    setSelectedAccount(accountParam);
  }
}
