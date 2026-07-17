import { fetchComebacks } from '@/actions/kpop';
import Footer from '@/app/_components/Footer';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import {
  searchParamsToKpopQueryState,
  getCanonicalKpopSearchParams,
  getKpopView,
} from '@/lib/kpop/query';
import { ArrowUp } from 'lucide-react';
import { redirect } from 'next/navigation';

import ComebacksForm from './_components/ComebacksForm';
import ErrorResponse from './_components/ErrorResponse';
import FollowedArtistsDialog from './_components/FollowedArtistsDialog';
import FollowingKpopResults from './_components/FollowingKpopResults';
import KpopInfiniteResults from './_components/KpopInfiniteResults';
import ScrollIndicator from './_components/ScrollIndicator';
import { FollowingProvider } from './_context/FollowingStore';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KpopPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const canonicalSearchParams =
    getCanonicalKpopSearchParams(resolvedSearchParams);
  const canonicalUrl = `/kpop?${canonicalSearchParams.toString()}`;
  const rawSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) {
        rawSearchParams.set(key, value[0]);
      }
      continue;
    }
    if (value) {
      rawSearchParams.set(key, value);
    }
  }

  if (rawSearchParams.toString() !== canonicalSearchParams.toString()) {
    redirect(canonicalUrl);
  }

  const queryState = searchParamsToKpopQueryState(canonicalSearchParams);
  const kpopView = getKpopView(canonicalSearchParams);
  const comebacksResult =
    kpopView === 'following' ? null : await fetchComebacks(queryState);

  if (typeof comebacksResult === 'string') {
    return <ErrorResponse serverError={comebacksResult} />;
  }

  return (
    <main
      id='kpop-top'
      className='flex min-h-screen flex-col items-center gap-4 bg-background-kp'
    >
      <ScrollIndicator colorValue='hsl(224,80%,50%)' />
      <Navbar />
      <div className='flex w-full max-w-[1400px] flex-1 flex-col items-center gap-6 px-4 pb-8 pt-2 md:px-6'>
        <div className='flex w-full flex-col gap-2 text-center'>
          <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
            Kpop Comebacks
          </h1>
          <p className='text-sm text-muted-foreground md:text-base'>
            Browse recent and upcoming Kpop song releases or search through the
            archive for specific comebacks.
          </p>
        </div>
        <FollowingProvider>
          <FollowedArtistsDialog />
          <ComebacksForm />
          <div className='flex w-full grow flex-col items-center gap-4 pt-2'>
            {kpopView === 'following' ? (
              <FollowingKpopResults />
            ) : (
              <KpopInfiniteResults
                initialResult={comebacksResult!}
                initialState={queryState}
              />
            )}
          </div>
        </FollowingProvider>
        <div className='flex w-full justify-center pt-2'>
          <Button
            asChild
            variant='outline'
            className='rounded-sm border-primary-kp/40 bg-transparent hover:bg-primary-kp/10'
          >
            <a href='#kpop-top'>
              <ArrowUp className='mr-2 h-4 w-4' />
              Back to top
            </a>
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
