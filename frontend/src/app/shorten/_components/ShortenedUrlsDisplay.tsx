'use client';

import { ShortenedUrl } from '@/lib/types/shorten';
import UrlCard from './UrlCard';
import React from 'react';

export default function ShortenedUrlsDisplay({
  urls,
  loadFailed,
  createdUrlOutput,
  setCreatedUrlOutput,
  onDeleted,
}: {
  urls: ShortenedUrl[];
  loadFailed: boolean;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
  onDeleted: (shortCode: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<'newest' | 'most-used'>('newest');
  // A failed load with nothing created since is not an empty list, so the
  // empty-list hint must not show.
  if (loadFailed && urls.length === 0) {
    return <div>Failed to fetch URLs</div>;
  }
  const displayed = urls
    .filter((url) => `${url.short_id} ${url.url}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'most-used' ? b.number_of_uses - a.number_of_uses : b.created.getTime() - a.created.getTime());
  return (
    <article className='mt-8 flex w-full flex-col items-center gap-2 rounded-md border-2'>
      <h2 className='w-full bg-secondary/60 py-2 text-center text-xl font-bold'>
        Your Shortened URLs
      </h2>
      {loadFailed && (
        // Without this, URLs created this session would read as the full list.
        <p role='status' className='px-2 text-center text-red-500'>
          Failed to fetch URLs. Only URLs created since this page loaded are
          shown.
        </p>
      )}
      <div className='flex w-full flex-wrap gap-2 px-2'>
        <input aria-label='Search shortened URLs' className='flex-1 rounded-md border bg-background px-3 py-2' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search alias or destination' />
        <select aria-label='Sort shortened URLs' className='rounded-md border bg-background px-3 py-2' value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'most-used')}>
          <option value='newest'>Newest</option>
          <option value='most-used'>Most used</option>
        </select>
      </div>
      <section className='grid-auto-fill-md w-full gap-2 px-2 py-4 text-foreground/80 dark:text-foreground'>
        <Placeholder urlsResponseLength={urls.length} />
        {displayed.map((shortenedUrl) => (
          <UrlCard
            key={shortenedUrl.short_id}
            shortenedUrl={shortenedUrl}
            createdUrlOutput={createdUrlOutput}
            setCreatedUrlOutput={setCreatedUrlOutput}
            onDeleted={onDeleted}
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
