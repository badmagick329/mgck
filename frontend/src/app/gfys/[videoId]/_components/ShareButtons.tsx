import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { isShortcutBlocked } from '@/lib/gfys/keyboard';
import { handleCopyToClipboard } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { MdOutlineContentCopy } from 'react-icons/md';

type ToastType = ReturnType<typeof useToast>['toast'];

export default function ShareButtons({
  imgurId,
  videoUrl,
}: {
  imgurId: string;
  videoUrl: string;
}) {
  const { toast } = useToast();

  return (
    <div className='grid grid-cols-2 gap-2'>
      <ShareButton
        url={`https://imgur.com/${imgurId}.mp4`}
        text='Copy Imgur video link'
        shortcut='i'
        toast={toast}
      />
      {!videoUrl.includes('imgur') && (
        <ShareButton
          url={videoUrl}
          text='Copy HQ video link'
          shortcut='q'
          toast={toast}
        />
      )}
    </div>
  );
}

function ShareButton({
  url,
  text,
  shortcut,
  toast,
}: {
  url: string;
  text: string;
  shortcut: 'i' | 'q';
  toast: ToastType;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e)) {
        return;
      }
      if (e.key.toLowerCase() === shortcut) {
        ref.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            aria-label={text}
            className='h-9 w-full gap-1.5 border-primary-gf/30 bg-transparent px-2 text-xs shadow-none hover:bg-primary-gf/10'
            onClick={() => handleCopyToClipboard(url, toast)}
            ref={ref}
          >
            <MdOutlineContentCopy aria-hidden='true' />
            <span>{shortcut === 'i' ? 'Copy Imgur link' : 'Copy HQ link'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>
            {text} [{shortcut}]
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
