'use client';

import SearchFormContent from './SearchFormContent';
import SearchNavigation from './SearchNavigation';

export default function SearchForm() {
  return (
    <div className='flex flex-col items-center'>
      <SearchFormContent />
      <SearchNavigation onClient={true} />
    </div>
  );
}
