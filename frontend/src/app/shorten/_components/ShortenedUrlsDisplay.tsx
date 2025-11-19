'use client';

import { ShortenedUrl } from '@/lib/types/shorten';
import UrlCard from './UrlCard';
import React from 'react';

export default function ShortenedUrlsDisplay({
  urlsResponse,
  createdUrlOutput,
  setCreatedUrlOutput,
}: {
  urlsResponse: ShortenedUrl[] | null;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  if (urlsResponse === null) {
    return <div>Failed to fetch URLs</div>;
  }
  return (
    <article className='mt-8 flex w-full flex-col items-center gap-2 rounded-md border-2'>
      <h2 className='w-full bg-secondary/60 py-2 text-center text-xl font-bold'>
        Your Shortened URLs
      </h2>
      <section className='grid-auto-fill-md w-full gap-2 px-2 py-4 text-foreground/80 dark:text-foreground'>
        <Placeholder urlsResponseLength={urlsResponse.length} />
        {urlsResponse.map((shortenedUrl) => (
          <UrlCard
            key={shortenedUrl.short_id}
            shortenedUrl={shortenedUrl}
            createdUrlOutput={createdUrlOutput}
            setCreatedUrlOutput={setCreatedUrlOutput}
          />
        ))}
      </section>
    </article>
  );
}

function Placeholder({ urlsResponseLength }: { urlsResponseLength: number }) {
  if (urlsResponseLength === 0) {
    return (
      <span className='text-foreground/60'>
        It appears that you have not created any shortened URLs yet 🧐
      </span>
    );
  }
  return null;
}
