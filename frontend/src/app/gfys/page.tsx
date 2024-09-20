import Navbar from '@/components/navbar';

import GfyList from './_components/gfy-list';
import SearchForm from './_components/search-form';
import SearchNavigation from './_components/search-navigation';

export default function GfysHome() {
  return (
    <main className='bg-background-gf dark:bg-background-gf-dark flex min-h-dvh w-full flex-col items-center'>
      <Navbar />
      <div className='flex w-full grow flex-col items-center px-10 py-4'>
        <SearchForm />
        <GfyList />
        <SearchNavigation onClient={false} />
      </div>
    </main>
  );
}
