'use client';

import { fetchAllUrls } from '@/actions/urlshortener';
import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import { useEffect, useState } from 'react';
import UrlCard from './UrlCard';

export default function ShortenedUrlsDisplay({
  username,
}: {
  username: string;
}) {
  const [urlsResponse, setUrlsResponse] = useState<ShortenedUrl[] | null>([]);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const result = await fetchAllUrls(username);
      result.urls ? setUrlsResponse(result.urls) : setUrlsResponse(null);
    })();
  }, []);

  if (urlsResponse === null) {
    return <div>Failed to fetch URLs</div>;
  }

  return (
    <article className='flex w-full flex-col items-center gap-2 px-2 pt-12'>
      <h2 className='text-xl font-bold'>Your Shortened URLs</h2>
      <section className='grid-auto-fill-md w-full gap-2 text-foreground/80 dark:text-foreground'>
        {urlsResponse.map((url) => (
          <UrlCard key={url.short_id} url={url} toast={toast} />
        ))}
      </section>
    </article>
  );
}
