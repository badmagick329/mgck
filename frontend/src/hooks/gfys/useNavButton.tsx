import { useGfyContext } from '@/app/gfys/_context/store';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ImArrowLeft, ImArrowRight } from 'react-icons/im';

export default function useNavButton(direction: 'previous' | 'next') {
  const [isDisabled, setIsDisabled] = useState(false);
  const { nextGfyExists, previousGfyExists, goToNextGfy, goToPreviousGfy } =
    useGfyContext();

  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (direction === 'next' && !nextGfyExists()) {
      setIsDisabled(true);
    }
    if (direction === 'previous' && !previousGfyExists()) {
      setIsDisabled(true);
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

  const handleClick = async () => {
    try {
      setIsDisabled(true);
      const newUrl =
        direction === 'next' ? await goToNextGfy() : await goToPreviousGfy();
      if (newUrl) {
        router.push(newUrl);
      }
    } finally {
      setIsDisabled(false);
    }
  };

  return {
    isDisabled,
    shouldRender: nextGfyExists() || previousGfyExists(),
    buttonRef: direction === 'previous' ? leftRef : rightRef,
    tooltipText:
      direction === 'next'
        ? 'Next [Right Arrow] [l]'
        : 'Next [Right Arrow] [l]',
    Icon: direction === 'previous' ? ImArrowLeft : ImArrowRight,
    handleClick,
  };
}
