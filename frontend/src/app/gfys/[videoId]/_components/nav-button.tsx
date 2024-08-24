import { useGlobalContext } from '@/app/gfys/context/store';
import { Button } from '@/components/ui/button';
import { GFYS_BASE } from '@/lib/consts/urls';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ImArrowLeft, ImArrowRight } from 'react-icons/im';

export default function NavButton({
  direction,
}: {
  direction: 'previous' | 'next';
}) {
  const Icon = direction === 'previous' ? ImArrowLeft : ImArrowRight;
  const { data, gfyViewData, setGfyViewData, updateDataFromURL } =
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

  const getNextURL = () => {
    return direction === 'next' && data.next ? data.next : null;
  };
  const getPrevURL = () => {
    return direction === 'previous' && data.previous ? data.previous : null;
  };

  const tryNewURL = () => {
    if (gfyViewData.index >= gfyViewData.videoIds.length - 1) {
      return getNextURL();
    } else if (gfyViewData.index <= 0) {
      return getPrevURL();
    }
    return null;
  };

  const navigationURL = () =>
    `${GFYS_BASE}/${gfyViewData.videoIds[gfyViewData.index + offset]}`;

  return (
    <Button
      disabled={disabledButton}
      variant='secondary'
      size={'icon'}
      ref={direction === 'previous' ? leftRef : rightRef}
      onClick={(e) => {
        const newURL = tryNewURL();
        if (!newURL) {
          setGfyViewData((old) => {
            return {
              ...old,
              index: old.index + offset,
            };
          });
          router.replace(navigationURL());
          return;
        }

        (async () => {
          setDisabledButton(true);
          const newData = await updateDataFromURL(newURL);
          if (newData === null) {
            // NOTE: This would only happen if the passed url had no params.
            // This url would be coming from the server and should always have all params
            console.error('No URL params found in passed URL');
            setDisabledButton(false);
            return;
          }
          try {
            const videoIds = newData.gfys.map((gfy) => gfy.imgurId);
            let newIndex = direction === 'next' ? 0 : videoIds.length - 1;
            setGfyViewData((old) => ({
              ...old,
              index: newIndex,
              videoIds,
            }));
            router.replace(`${GFYS_BASE}/${videoIds[newIndex]}`);
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
