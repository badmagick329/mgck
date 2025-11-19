'use client';

import { deleteShortenedUrl } from '@/actions/urlshortener';
import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import { handleCopyToClipboard } from '@/lib/utils';
import {
  ChevronDown,
  Clipboard,
  ChevronUp,
  CornerRightDown,
  Trash,
} from 'lucide-react';
import { useState } from 'react';

const MAX_URL_DISPLAY_LENGTH = 120;
const BUTTON_SIZE = 16;

export default function UrlCard({
  shortenedUrl,
  createdUrlOutput,
  setCreatedUrlOutput,
}: {
  shortenedUrl: ShortenedUrl;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [truncated, setTruncated] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const { toast } = useToast();

  console.log();
  const baseUrl =
    process.env.NEXT_PUBLIC_DEV_URL || `https://${window.location.hostname}`;
  const shortUrl = `${baseUrl}/${shortenedUrl.short_id}`;
  let sourceUrl = truncated
    ? shortenedUrl.url.slice(0, MAX_URL_DISPLAY_LENGTH)
    : shortenedUrl.url;
  truncated &&
    shortenedUrl.url.length > MAX_URL_DISPLAY_LENGTH &&
    (sourceUrl += '...');

  return (
    <section className='flex max-w-[800px] flex-col rounded-md bg-secondary px-4 py-2'>
      <div className='flex justify-between text-xs'>
        <span>Created: {formatDatetime(shortenedUrl.created)}</span>
        <span>Number of Uses: {shortenedUrl.number_of_uses}</span>
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
          <div className='flex gap-2'>
            <button
              className='rounded-md bg-background/40 p-2 hover:bg-background/60'
              onClick={async () => await handleCopyToClipboard(shortUrl, toast)}
            >
              <Clipboard size={BUTTON_SIZE} />
            </button>
            <button
              className='rounded-md bg-background/40 p-2 hover:bg-background/60'
              disabled={isDeleteDisabled}
              onClick={async () => {
                try {
                  setIsDeleteDisabled(true);
                  await deleteShortenedUrl({ code: shortenedUrl.short_id });
                  const match = createdUrlOutput.match(/(?:.+\/)(.+)/);
                  if (!match) {
                    return;
                  }
                  const idFromUrl = match[1];
                  if (idFromUrl === shortenedUrl.short_id) {
                    setCreatedUrlOutput('');
                  }
                } finally {
                  setIsDeleteDisabled(false);
                }
              }}
            >
              <Trash size={BUTTON_SIZE} />
            </button>
          </div>
        </div>
        <a
          className='break-words pr-2 font-semibold text-orange-600 hover:underline dark:text-orange-400'
          target='_blank'
          href={shortenedUrl.url}
        >
          {sourceUrl}
        </a>
        {shortenedUrl.url.length > MAX_URL_DISPLAY_LENGTH && (
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
        Last Accessed:{' '}
        {shortenedUrl.accessed
          ? formatDatetime(shortenedUrl.accessed)
          : 'Never'}
      </span>
    </section>
  );
}
const formatDatetime = (d: Date): string => {
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
};
