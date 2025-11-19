'use client';

import { deleteShortenedUrl } from '@/actions/urlshortener';
import { Button } from '@/components/ui/button';
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
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CgSpinnerAlt } from 'react-icons/cg';

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
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const offset = (window.innerHeight - viewport.height) / 2;
      setKeyboardOffset(offset);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  className='rounded-md bg-background/40 p-2 hover:bg-background/60'
                  disabled={isDeleteDisabled}
                >
                  <Trash size={BUTTON_SIZE} />
                </button>
              </DialogTrigger>
              <DialogContent
                className='sm:max-w-[425px]'
                style={{
                  transform: `translate(-50%, calc(-50% - ${keyboardOffset}px))`,
                }}
              >
                <DialogHeader>
                  <DialogTitle>Confirm Delete</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this shortened URL?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <div className='flex justify-end'>
                    <Button
                      disabled={isDeleteDisabled}
                      variant={'destructive'}
                      onClick={async () => {
                        try {
                          setIsDeleteDisabled(true);
                          await new Promise((r) => setTimeout(r, 3000));
                          await deleteShortenedUrl({
                            code: shortenedUrl.short_id,
                          });
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
                      <div className='flex items-center gap-2'>
                        Submit
                        {isDeleteDisabled && (
                          <CgSpinnerAlt className='animate-spin' size={18} />
                        )}
                      </div>
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
