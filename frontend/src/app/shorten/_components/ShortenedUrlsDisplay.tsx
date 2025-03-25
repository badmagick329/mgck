'use client';

import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import UrlCard from './UrlCard';
import { CgSpinner } from 'react-icons/cg';

export default function ShortenedUrlsDisplay({
  urlsResponse,
  urlsResponseLoaded,
}: {
  urlsResponse: ShortenedUrl[] | null;
  urlsResponseLoaded: boolean;
}) {
  const { toast } = useToast();

  if (urlsResponse === null) {
    return <div>Failed to fetch URLs</div>;
  }
  let placeHolder: React.ReactNode = <CgSpinner size={16} />;

  if (urlsResponseLoaded && urlsResponse.length === 0) {
    placeHolder =
      'It appears that you have not created any shortened URLs yet 🧐';
  }

  return (
    <article className='mt-8 flex w-full flex-col items-center gap-2 rounded-md border-2'>
      <h2 className='w-full bg-secondary/60 py-2 text-center text-xl font-bold'>
        Your Shortened URLs
      </h2>
      <section className='grid-auto-fill-md w-full gap-2 px-2 py-4 text-foreground/80 dark:text-foreground'>
        <Placeholder
          urlsResponseLoaded={urlsResponseLoaded}
          urlsResponseLength={urlsResponse.length}
        />
        {urlsResponse.map((url) => (
          <UrlCard key={url.short_id} url={url} toast={toast} />
        ))}
      </section>
    </article>
  );
}

function Placeholder({
  urlsResponseLoaded,
  urlsResponseLength,
}: {
  urlsResponseLoaded: boolean;
  urlsResponseLength: number;
}) {
  if (urlsResponseLoaded && urlsResponseLength === 0) {
    return (
      <span className='text-foreground/60'>
        It appears that you have not created any shortened URLs yet 🧐
      </span>
    );
  }
  if (!urlsResponseLoaded && urlsResponseLength === 0) {
    return (
      <span>
        <CgSpinner size={16} className='animate-spin' />
      </span>
    );
  }
  return null;
}
