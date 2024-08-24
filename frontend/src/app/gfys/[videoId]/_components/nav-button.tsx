import { useGlobalContext } from '@/app/gfys/context/store';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ImArrowLeft, ImArrowRight } from 'react-icons/im';

export default function NavButton({
  direction,
}: {
  direction: 'previous' | 'next';
}) {
  const Icon = direction === 'previous' ? ImArrowLeft : ImArrowRight;
  const { data, gfyViewData, goToGfyAtIndex, updateDataFromURL } =
    useGlobalContext();
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const offset = direction === 'previous' ? -1 : 1;
  const [disabledButton, setDisabledButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (
      direction === 'next' &&
      gfyViewData.index >= gfyViewData.videoIds.length - 1 &&
      data.next === null
    ) {
      setDisabledButton(true);
    }
    if (
      direction === 'previous' &&
      gfyViewData.index <= 0 &&
      data.previous === null
    ) {
      setDisabledButton(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'l') {
        rightRef.current?.click();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        leftRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (gfyViewData && gfyViewData.videoIds.length == 0) {
    return null;
  }

  const tryNewURL = () => {
    if (gfyViewData.index >= gfyViewData.videoIds.length - 1) {
      return direction === 'next' && data.next ? data.next : null;
    }

    if (gfyViewData.index <= 0) {
      return direction === 'previous' && data.previous ? data.previous : null;
    }

    return null;
  };

  return (
    <Button
      disabled={disabledButton}
      variant='secondary'
      size={'icon'}
      ref={direction === 'previous' ? leftRef : rightRef}
      onClick={(e) => {
        const newURL = tryNewURL();
        if (!newURL) {
          const newGfyURL = goToGfyAtIndex(gfyViewData.index + offset);
          router.replace(newGfyURL);
          return;
        }

        (async () => {
          setDisabledButton(true);
          const startIndex = direction === 'next' ? 0 : -1;
          try {
            const newGfyURL = await updateDataFromURL(newURL, startIndex);
            if (newGfyURL) {
              router.replace(newGfyURL);
            }
          } finally {
            setDisabledButton(false);
          }
        })();
      }}
    >
      <Icon />
    </Button>
  );
}
