'use client';

import { fetchComebacks } from '@/actions/kpop';
import { ThemeToggler } from '@/components/theme-toggler';
import { ComebackResponse, ComebacksResult } from '@/lib/types';
import { useEffect, useState } from 'react';

import ComebackCard from './comeback-card';
import ComebacksForm from './comebacks-form';

export default function KpopMain({
  comebacksResult: initialComebacksResult,
  comebacks: initialComebacks,
  children,
}: {
  comebacksResult: ComebacksResult;
  comebacks: ComebackResponse[];
  children: React.ReactNode;
}) {
  const [comebacksResult, setComebacksResult] = useState<ComebacksResult>(
    initialComebacksResult
  );
  const [comebacks, setComebacks] =
    useState<ComebackResponse[]>(initialComebacks);

  return (
    <main className='flex min-h-screen flex-col items-center gap-4'>
      <div className='flex w-full justify-end px-2 pt-2'>
        <ThemeToggler />
      </div>
      <h2 className='text-2xl font-semibold'>Upcoming Comebacks</h2>
      {children}
      <div className='flex flex-col items-center gap-4 pt-4'>
        <div className='grid grid-cols-1 gap-12 px-4 xl:grid-cols-2 2xl:grid-cols-3'>
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
    </main>
  );
}
