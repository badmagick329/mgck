'use client';

import { fetchComebacks } from '@/actions/kpop';
import Navbar from '@/app/_components/Navbar';
import ScrollIndicator from '@/app/kpop/_components/ScrollIndicator';
import { ComebackResponse, ComebacksResult } from '@/lib/types/kpop';
import { searchParamsToFormData } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import ComebackCard from './_components/ComebackCard';
import ComebacksForm from './_components/ComebacksForm';
import ErrorResponse from './_components/ErrorResponse';
import Loading from './loading';
import Footer from '@/app/_components/Footer';

export default function KpopPage() {
  const [comebacksResult, setComebacksResult] =
    useState<ComebacksResult | null>(null);
  const [comebacks, setComebacks] = useState<ComebackResponse[]>([]);
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const comebacksResult = await fetchComebacks(
        searchParamsToFormData(searchParams)
      );
      if (typeof comebacksResult === 'string') {
        setServerError(comebacksResult);
      } else {
        setComebacksResult(comebacksResult);
        setComebacks(comebacksResult.results);
      }
    })();
  }, [searchParams]);

  if (serverError) {
    return <ErrorResponse serverError={serverError} />;
  }

  if (comebacksResult === null) {
    return <Loading />;
  }

  return (
    <main className='flex min-h-screen flex-col items-center gap-4 bg-background-kp'>
      <ScrollIndicator colorValue='hsl(224,80%,50%)' />
      <Navbar />
      <h2 className='text-2xl font-semibold'>Upcoming Comebacks</h2>
      <ComebacksForm totalPages={comebacksResult.total_pages} />
      <div className='flex grow flex-col items-center gap-4 pt-4'>
        <div className='grid grid-cols-1 gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3'>
          {comebacks.map((comeback) => (
            <ComebackCard
              key={comeback.id}
              title={comeback.title}
              artist={comeback.artist}
              album={comeback.album}
              releaseType={comeback.release_type}
              releaseDate={comeback.date}
              urls={comeback.urls}
            />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
