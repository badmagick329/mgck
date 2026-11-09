import Navbar from '@/app/_components/Navbar';
import { getCanonicalGfysUrl } from '@/lib/gfys';
import type { Metadata } from 'next';

import GfyList from '../_components/GfyList';
import SearchForm from '../_components/SearchForm';
import SearchNavigation from '../_components/SearchNavigation';
import Footer from '@/app/_components/Footer';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const canonical = getCanonicalGfysUrl(await searchParams);
  return {
    alternates: { canonical },
    // Results load in a client effect, so a filtered or paged listing's server
    // HTML holds no clips and repeats the layout's title: thin duplicates that
    // Google crawls but won't index (MGK-15). Only bare /gfys is indexable;
    // follow still lets crawlers reach clips from the rendered results.
    ...(canonical !== '/gfys' && { robots: { index: false, follow: true } }),
  };
}

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
