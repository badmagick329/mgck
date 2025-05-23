import Navbar from '@/app/_components/Navbar';

import GfyList from './_components/GfyList';
import SearchForm from './_components/SearchForm';
import SearchNavigation from './_components/SearchNavigation';
import Footer from '@/app/_components/Footer';

export default function GfysHome() {
  return (
    <main className='flex min-h-dvh w-full flex-col items-center bg-background-gf dark:bg-background-gf-dark'>
      <Navbar />
      <div className='flex w-full grow flex-col items-center px-10 py-4'>
        <SearchForm />
        <GfyList />
        <SearchNavigation onClient={false} />
      </div>
      <Footer />
    </main>
  );
}
