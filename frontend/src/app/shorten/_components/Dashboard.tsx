'use client';

import { fetchAllUrls } from '@/actions/urlshortener';
import { ShortenedUrl } from '@/lib/types/shorten';
import { CornerRightDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard({ username }: { username: string }) {
  const [urlsResponse, setUrlsResponse] = useState<ShortenedUrl[] | null>([]);

  useEffect(() => {
    (async () => {
      const result = await fetchAllUrls(username);
      if (result.urls) {
        console.log(result.urls);
        setUrlsResponse(result.urls);
      } else {
        console.error(result.error);
        setUrlsResponse(null);
      }
    })();
  }, []);

  if (urlsResponse === null) {
    return <div>Failed to fetch URLs</div>;
  }

  return (
    <article className='grid-auto-fill-md w-full gap-2 text-foreground/80 dark:text-foreground'>
      {urlsResponse.map((url) => {
        const shortUrl = `https://${window.location.hostname}/${url.short_id}`;
        return (
          <section
            className='flex flex-col rounded-md bg-secondary px-4 py-2'
            key={url.short_id}
          >
            <div className='flex justify-between text-xs'>
              <span>Created: {formatDatetime(url.created)}</span>
              <span>Number of Uses: {url.number_of_uses}</span>
            </div>
            <div className='flex flex-col py-6'>
              <div className='flex items-end gap-2'>
                <a
                  className='font-semibold text-green-600 hover:underline dark:text-green-400'
                  target='_blank'
                  href={shortUrl}
                >
                  {shortUrl}
                </a>
                <CornerRightDown size={16} />
              </div>
              <a
                className='font-semibold text-orange-600 hover:underline dark:text-orange-400'
                target='_blank'
                href={url.url}
              >
                {url.url}
              </a>
            </div>
            <span className='self-start text-xs'>
              Last Accessed:{' '}
              {url.accessed ? formatDatetime(url.accessed) : 'Never'}
            </span>
          </section>
        );
      })}
    </article>
  );
}

const formatDatetime = (d: Date): string => {
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  // return d.toISOString().replace('T', ' ').split('.')[0];
};
