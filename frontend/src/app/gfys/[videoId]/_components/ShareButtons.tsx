import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn, handleCopyToClipboard } from '@/lib/utils';
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
    <div className='flex justify-center gap-2'>
      <ShareButton
        url={`https://imgur.com/${imgurId}.mp4`}
        text={'Imgur'}
        toast={toast}
      />
      {!videoUrl.includes('imgur') && (
        <ShareButton url={videoUrl} text={'HQ'} toast={toast} />
      )}
    </div>
  );
}

function ShareButton({
  url,
  text,
  toast,
}: {
  url: string;
  text: string;
  toast: ToastType;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const isImgur = text === 'Imgur';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isImgur && e.key === 'i') {
        ref.current?.click();
      } else if (!isImgur && e.key === 'q') {
        ref.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='secondary'
            className={cn(
              'text-bold bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
            )}
            onClick={() => handleCopyToClipboard(url, toast)}
            ref={ref}
          >
            <span className='flex items-center gap-2'>
              <MdOutlineContentCopy />
              <span>{text}</span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isImgur ? (
            <span>Copy [i]mgur Link</span>
          ) : (
            <span>Copy H[q] Link</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
