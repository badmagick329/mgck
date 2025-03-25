'use client';

import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import { copyToClipboard, topRightDefaultToast } from '@/lib/utils';
import {
  ChevronDown,
  Clipboard,
  ChevronUp,
  CornerRightDown,
} from 'lucide-react';
import { useState } from 'react';

type ToastType = ReturnType<typeof useToast>['toast'];

const MAX_URL_DISPLAY_LENGTH = 120;
const BUTTON_SIZE = 16;

export default function UrlCard({
  url,
  toast,
}: {
  url: ShortenedUrl;
  toast: ToastType;
}) {
  const [truncated, setTruncated] = useState(true);

  const shortUrl = `https://${window.location.hostname}/${url.short_id}`;
  let sourceUrl = truncated
    ? url.url.slice(0, MAX_URL_DISPLAY_LENGTH)
    : url.url;
  truncated && url.url.length > MAX_URL_DISPLAY_LENGTH && (sourceUrl += '...');

  return (
    <section className='flex max-w-[800px] flex-col rounded-md bg-secondary px-4 py-2'>
      <div className='flex justify-between text-xs'>
        <span>Created: {formatDatetime(url.created)}</span>
        <span>Number of Uses: {url.number_of_uses}</span>
      </div>
      <div className='flex grow flex-col gap-2 py-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-end gap-2'>
            <a
              className='font-semibold text-green-600 hover:underline dark:text-green-400'
              target='_blank'
              href={shortUrl}
            >
              {shortUrl}
            </a>
            <CornerRightDown size={BUTTON_SIZE} />
          </div>
          <button className='rounded-md bg-background/40 p-2 hover:bg-background/60'>
            <Clipboard
              onClick={() => {
                copyToClipboard(shortUrl);
                topRightDefaultToast('Short URL copied to clipboard', toast);
              }}
              size={BUTTON_SIZE}
            />
          </button>
        </div>
        <a
          className='break-words pr-2 font-semibold text-orange-600 hover:underline dark:text-orange-400'
          target='_blank'
          href={url.url}
        >
          {sourceUrl}
        </a>
        {url.url.length > MAX_URL_DISPLAY_LENGTH && (
          <abbr className='self-end' title={truncated ? 'Expand' : 'Collapse'}>
            <button
              className='rounded-md bg-background/40 px-2 py-1 hover:bg-background/60'
              onClick={() => setTruncated((prev) => !prev)}
            >
              {truncated ? (
                <ChevronDown size={BUTTON_SIZE} />
              ) : (
                <ChevronUp size={BUTTON_SIZE} />
              )}
            </button>
          </abbr>
        )}
      </div>
      <span className='self-start text-xs'>
        Last Accessed: {url.accessed ? formatDatetime(url.accessed) : 'Never'}
      </span>
    </section>
  );
}
const formatDatetime = (d: Date): string => {
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
};
