'use client';

import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import UrlCard from './UrlCard';

export default function ShortenedUrlsDisplay({
  urlsResponse,
}: {
  urlsResponse: ShortenedUrl[] | null;
}) {
  const { toast } = useToast();

  if (urlsResponse === null) {
    return <div>Failed to fetch URLs</div>;
  }

  return (
    <article className='mt-8 flex w-full flex-col items-center gap-2 rounded-md border-2'>
      <h2 className='w-full bg-secondary/60 py-2 text-center text-xl font-bold'>
        Your Shortened URLs
      </h2>
      <section className='grid-auto-fill-md w-full gap-2 px-2 py-4 text-foreground/80 dark:text-foreground'>
        {urlsResponse.length === 0 ? (
          <span className='text-foreground/60'>
            It appears that you have not created any shortened URLs yet 🧐
          </span>
        ) : (
          urlsResponse.map((url) => (
            <UrlCard key={url.short_id} url={url} toast={toast} />
          ))
        )}
      </section>
    </article>
  );
}
