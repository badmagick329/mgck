'use client';

import SearchFormContent from './search-form-content';
import SearchNavigation from './search-navigation';

export default function SearchForm() {
  return (
    <div className='flex flex-col items-center'>
      <SearchFormContent />
      <SearchNavigation onClient={true} />
    </div>
  );
}
