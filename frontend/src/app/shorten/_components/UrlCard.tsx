'use client';

import { Button } from '@/components/ui/button';
import { ShortenedUrl } from '@/lib/types/shorten';
import { Clipboard, CornerRightDown, Trash } from 'lucide-react';
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
import useDeleteUrlButton from '@/hooks/shorten/useDeleteUrlButton';
import useUrlCardContent from '@/hooks/shorten/useUrlCardContent';

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
  return (
    <section className='flex max-w-[800px] flex-col rounded-md bg-secondary px-4 py-2'>
      <div className='flex justify-between text-xs'>
        <span>Created: {formatDatetime(shortenedUrl.created)}</span>
        <span>Number of Uses: {shortenedUrl.number_of_uses}</span>
      </div>
      <UrlCardContent
        shortenedUrl={shortenedUrl}
        createdUrlOutput={createdUrlOutput}
        setCreatedUrlOutput={setCreatedUrlOutput}
      />
      <span className='self-start text-xs'>
        Last Accessed:{' '}
        {shortenedUrl.accessed
          ? formatDatetime(shortenedUrl.accessed)
          : 'Never'}
      </span>
    </section>
  );
}

function UrlCardContent({
  shortenedUrl,
  createdUrlOutput,
  setCreatedUrlOutput,
}: {
  shortenedUrl: ShortenedUrl;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const {
    shortUrl,
    sourceUrl,
    showTruncateIcon,
    TruncateIcon,
    truncateButtonTooltip,
    handleCopy,
    handleTruncate,
  } = useUrlCardContent({ shortenedUrl, buttonSize: BUTTON_SIZE });

  return (
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
            onClick={handleCopy}
          >
            <Clipboard size={BUTTON_SIZE} />
          </button>
          <DeleteUrlButton
            shortCode={shortenedUrl.short_id}
            createdUrlOutput={createdUrlOutput}
            setCreatedUrlOutput={setCreatedUrlOutput}
          />
        </div>
      </div>
      <a
        className='break-words pr-2 font-semibold text-orange-600 hover:underline dark:text-orange-400'
        target='_blank'
        href={shortenedUrl.url}
      >
        {sourceUrl}
      </a>
      {showTruncateIcon && (
        <abbr className='self-end' title={truncateButtonTooltip}>
          <button
            className='rounded-md bg-background/40 px-2 py-1 hover:bg-background/60'
            onClick={handleTruncate}
          >
            <TruncateIcon />
          </button>
        </abbr>
      )}
    </div>
  );
}

function DeleteUrlButton({
  shortCode,
  createdUrlOutput,
  setCreatedUrlOutput,
}: {
  shortCode: string;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { open, setOpen, keyboardOffset, isDeleteDisabled, handleDelete } =
    useDeleteUrlButton({
      shortCode,
      createdUrlOutput,
      setCreatedUrlOutput,
    });

  return (
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
              onClick={handleDelete}
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
  );
}

const formatDatetime = (d: Date): string => {
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
};
